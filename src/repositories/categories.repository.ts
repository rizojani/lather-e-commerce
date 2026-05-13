import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { CATEGORYABLE_TYPE_CATEGORY, CATEGORY_TREE_EXCLUDED_ROOT_SLUGS } from '../common/constants/category-morph.constants';
import { escapeRegex } from '../common/utils/escape-regex';
import { slugify } from '../common/utils/slugify';
import { ProductListingStatus } from '../common/types/product-admin.enum';
import { Category, CategoryDocument } from '../schemas/category.schema';

const activeStatusOrLegacy = {
  $or: [{ status: ProductListingStatus.ACTIVE }, { status: { $exists: false } }],
};

const notDeleted = { deletedAt: null };

@Injectable()
export class CategoriesRepository {
  constructor(@InjectModel(Category.name) private readonly model: Model<CategoryDocument>) {}

  create(payload: Partial<Category>) {
    return this.model.create(payload);
  }

  async upsertDefaults(names: string[]) {
    await Promise.all(
      names.map((name) => {
        const generatedSlug = slugify(name);
        const title = name.length > 0 ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : name;
        return this.model.updateOne(
          { name },
          [
            {
              $set: {
                name,
                slug: { $ifNull: ['$slug', generatedSlug] },
                title: { $ifNull: ['$title', title] },
                description: { $ifNull: ['$description', `${name} category`] },
                status: { $ifNull: ['$status', ProductListingStatus.ACTIVE] },
                featured: { $ifNull: ['$featured', false] },
                sortOrder: { $ifNull: ['$sortOrder', 0] },
                seoTitle: { $ifNull: ['$seoTitle', ''] },
                seoDescription: { $ifNull: ['$seoDescription', ''] },
                image: { $ifNull: ['$image', null] },
                deletedAt: { $ifNull: ['$deletedAt', null] },
              },
            },
          ],
          { upsert: true },
        );
      }),
    );
  }

  /**
   * One-time (or safe repeat) migration: drop legacy unique `name` index, backfill morph/slug/title
   * on existing rows, then sync Mongoose indexes to the current schema.
   */
  async migrateCategoryCollection(): Promise<void> {
    const coll = this.model.collection;
    try {
      await coll.dropIndex('name_1');
    } catch {
      /* index missing or not unique */
    }

    const cursor = this.model.find({}).lean().cursor();
    const bulk: Array<{
      updateOne: {
        filter: { _id: Types.ObjectId };
        update: { $set: Record<string, unknown> };
      };
    }> = [];

    for await (const doc of cursor) {
      const d = doc as Record<string, unknown>;
      const name = String(d.name ?? '');
      const fallbackSlug = slugify(name);
      const title =
        typeof d.title === 'string' && d.title.length > 0
          ? d.title
          : name.length > 0
            ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
            : name;
      const slug = typeof d.slug === 'string' && d.slug.length > 0 ? String(d.slug).toLowerCase() : fallbackSlug;

      bulk.push({
        updateOne: {
          filter: { _id: d._id as Types.ObjectId },
          update: {
            $set: {
              categoryableType: d.categoryableType ?? null,
              categoryableId: d.categoryableId ?? null,
              slug,
              title,
              description: d.description != null ? String(d.description) : '',
              image: d.image ?? null,
              featured: Boolean(d.featured),
              sortOrder: typeof d.sortOrder === 'number' ? d.sortOrder : Number(d.sortOrder ?? 0),
              seoTitle: d.seoTitle != null ? String(d.seoTitle) : '',
              seoDescription: d.seoDescription != null ? String(d.seoDescription) : '',
              status: d.status ?? ProductListingStatus.ACTIVE,
              deletedAt: d.deletedAt ?? null,
            },
          },
        },
      });
    }

    if (bulk.length > 0) {
      await this.model.bulkWrite(bulk, { ordered: false });
    }

    await this.model.syncIndexes();
  }

  listPublicRootTree(): Promise<Array<Record<string, unknown>>> {
    const rootMatch: Record<string, unknown> = {
      ...notDeleted,
      categoryableType: null,
      categoryableId: null,
      ...activeStatusOrLegacy,
      slug: { $nin: [...CATEGORY_TREE_EXCLUDED_ROOT_SLUGS] },
    };

    const pipeline: PipelineStage[] = [
      { $match: rootMatch },
      { $sort: { sortOrder: 1, name: 1 } },
      {
        $lookup: {
          from: this.model.collection.name,
          let: { pid: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$categoryableType', CATEGORYABLE_TYPE_CATEGORY] },
                    { $eq: ['$categoryableId', '$$pid'] },
                    { $eq: ['$deletedAt', null] },
                    {
                      $or: [
                        { $eq: ['$status', ProductListingStatus.ACTIVE] },
                        { $eq: [{ $type: '$status' }, 'missing'] },
                      ],
                    },
                  ],
                },
              },
            },
            { $sort: { sortOrder: 1, name: 1 } },
          ],
          as: 'subCategories',
        },
      },
    ];

    return this.model
      .aggregate(pipeline)
      .collation({ locale: 'en', strength: 2 })
      .exec() as Promise<Array<Record<string, unknown>>>;
  }

  list() {
    return this.listPublicRootTree();
  }

  async listPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const filter = { ...notDeleted };
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, total, page, limit };
  }

  findActiveForDropdown() {
    return this.model
      .find({
        ...notDeleted,
        ...activeStatusOrLegacy,
      })
      .sort({ sortOrder: 1, name: 1 })
      .collation({ locale: 'en', strength: 2 })
      .lean()
      .exec();
  }

  findIdsByNameSearch(search: string): Promise<Array<{ _id: Types.ObjectId }>> {
    const trimmed = search.trim();
    if (!trimmed) {
      return Promise.resolve([]);
    }
    const pattern = new RegExp(escapeRegex(trimmed), 'i');
    return this.model
      .find({ ...notDeleted, name: pattern })
      .select('_id')
      .lean()
      .exec() as Promise<Array<{ _id: Types.ObjectId }>>;
  }

  async truncateAndSeedGenderTree(): Promise<void> {
    await this.model.deleteMany({}).exec();
    try {
      await this.model.collection.dropIndex('name_1');
    } catch {
      /* already dropped by migration */
    }

    const status = ProductListingStatus.ACTIVE;
    const rootRows = [
      { name: 'men', slug: 'men', title: 'Men', sortOrder: 1, featured: true },
      { name: 'women', slug: 'women', title: 'Women', sortOrder: 2, featured: true },
      { name: 'kid', slug: 'kid', title: 'Kids', sortOrder: 3, featured: true },
    ];

    const roots = await this.model.insertMany(
      rootRows.map((r) => ({
        categoryableType: null,
        categoryableId: null,
        name: r.name,
        slug: r.slug,
        title: r.title,
        description: `${r.title} category`,
        image: null,
        featured: r.featured,
        sortOrder: r.sortOrder,
        seoTitle: '',
        seoDescription: '',
        status,
        deletedAt: null,
      })),
    );

    const subTemplates = [
      { name: 'jacket', title: 'Jacket' },
      { name: 'bag', title: 'Bag' },
      { name: 'cap', title: 'Cap' },
      { name: 'shoes', title: 'Shoes' },
      { name: 'wallet', title: 'Wallet' },
      { name: 'belt', title: 'Belt' },
    ];

    const children: Array<Record<string, unknown>> = [];
    for (const parent of roots) {
      const pslug = parent.slug;
      subTemplates.forEach((sub, idx) => {
        children.push({
          categoryableType: CATEGORYABLE_TYPE_CATEGORY,
          categoryableId: parent._id,
          name: sub.name,
          slug: `${pslug}-${sub.name}`,
          title: sub.title,
          description: `${sub.title} under ${parent.title}`,
          image: null,
          featured: false,
          sortOrder: idx + 1,
          seoTitle: '',
          seoDescription: '',
          status,
          deletedAt: null,
        });
      });
    }

    await this.model.insertMany(children);
    await this.model.syncIndexes();
  }

  /**
   * Deletes **all** documents in `categories`. Product `category` ObjectIds may point at nothing
   * until you re-seed or fix products — use on disposable DBs only.
   */
  async clearAllCategories(): Promise<{ deletedCount: number }> {
    const r = await this.model.deleteMany({}).exec();
    return { deletedCount: r.deletedCount ?? 0 };
  }
}
