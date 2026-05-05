import { User } from '../schemas/user.schema';

export class UserResource {
  static toJson(user: User & { _id?: unknown; id?: string }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  /** Embedded customer on admin order responses (no secrets). */
  static forOrder(user: unknown) {
    if (user == null || typeof user !== 'object') {
      return null;
    }
    const u = user as Record<string, unknown>;
    return {
      id: String(u._id ?? u.id ?? ''),
      name: u.name ?? null,
      firstName: u.firstName ?? null,
      lastName: u.lastName ?? null,
      email: u.email ?? null,
      role: u.role ?? null,
    };
  }
}
