/** `discount` is percent off (0–100) applied to unit `price`. */
export function effectiveUnitPrice(price: number, discountPercent?: number | null): number {
  const p = Number(price) || 0;
  const d = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const raw = (p * (100 - d)) / 100;
  return Math.round(raw * 100) / 100;
}

export function lineSubtotal(
  quantity: number,
  price: number,
  discountPercent?: number | null,
): number {
  const unit = effectiveUnitPrice(price, discountPercent);
  return Math.round(quantity * unit * 100) / 100;
}
