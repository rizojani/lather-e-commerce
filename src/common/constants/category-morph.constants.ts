/** Polymorphic parent: child rows point at a parent category `_id`. */
export const CATEGORYABLE_TYPE_CATEGORY = 'category' as const;

export type CategoryableType = typeof CATEGORYABLE_TYPE_CATEGORY | null;

/**
 * Root category slugs hidden from the public category tree (used for storefront filters such as /products “gender”).
 * Kids merchandise can still exist in DB / admin; this only affects the shared tree API payload.
 */
export const CATEGORY_TREE_EXCLUDED_ROOT_SLUGS: readonly string[] = ['kid', 'kids'];
