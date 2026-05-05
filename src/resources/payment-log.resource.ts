export class PaymentLogResource {
  static one(raw: unknown) {
    if (raw == null || typeof raw !== 'object') {
      return null;
    }
    const p = raw as Record<string, unknown>;
    return {
      id: String(p._id ?? p.id ?? ''),
      status: p.status ?? null,
      amount: Number(p.amount ?? 0),
      paymentMethod: p.paymentMethod ?? null,
      transactionId: p.transactionId ?? null,
      createdAt: p.createdAt ?? null,
      updatedAt: p.updatedAt ?? null,
    };
  }
}
