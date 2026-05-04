import { Types } from 'mongoose';

/** ObjectId refs, plain ids, or populated Media subdocs — all become hex id strings. */
export function normalizedMediaId(m: unknown): string | null {
  if (m == null) return null;
  if (typeof m === 'string') {
    const t = m.trim();
    return Types.ObjectId.isValid(t) ? t : null;
  }
  if (typeof m === 'object') {
    if ('toHexString' in m && typeof (m as Types.ObjectId).toHexString === 'function') {
      const hex = (m as Types.ObjectId).toHexString();
      return Types.ObjectId.isValid(hex) ? hex : null;
    }
    const rec = m as Record<string, unknown>;
    if (rec._id != null) {
      return normalizedMediaId(rec._id);
    }
    if (typeof rec.id === 'string' && Types.ObjectId.isValid(rec.id)) {
      return rec.id;
    }
  }
  return null;
}

export function normalizeProductMediaRefs(refs: unknown[] | undefined): string[] {
  if (!refs?.length) return [];
  const ids: string[] = [];
  for (const m of refs) {
    const s = normalizedMediaId(m);
    if (s) ids.push(s);
  }
  return ids;
}
