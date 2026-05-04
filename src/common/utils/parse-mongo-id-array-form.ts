/**
 * Normalize form/query input to `string[]` of Mongo ids, or `undefined` if omitted / empty.
 * Supports: `key[0]=id1&key[1]=id2`, repeated keys, comma-separated, JSON array string, or `string[]`.
 */
export function parseMongoIdArrayFormValue(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const flattenIdTokens = (parts: unknown[]): string[] =>
    parts
      .flatMap((v) => {
        if (typeof v === 'string') return v.split(',');
        if (typeof v === 'number' && Number.isFinite(v)) return [String(v)];
        return [];
      })
      .map((s) => s.trim())
      .filter(Boolean);

  if (Array.isArray(value)) {
    const out = flattenIdTokens(value);
    return out.length ? out : undefined;
  }

  if (typeof value === 'object') {
    const rec = value as Record<string, unknown>;
    const keys = Object.keys(rec).sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
    const out = flattenIdTokens(keys.map((k) => rec[k]));
    return out.length ? out : undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) {
          const out = flattenIdTokens(parsed);
          return out.length ? out : undefined;
        }
      } catch {
        /* fall through */
      }
    }
    const out = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    return out.length ? out : undefined;
  }

  return undefined;
}
