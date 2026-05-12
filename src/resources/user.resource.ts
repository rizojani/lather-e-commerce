import { User } from '../schemas/user.schema';

function normalizeMediaPath(pathValue: unknown): string {
  return String(pathValue ?? '').replace(/\\/g, '/');
}

interface ProfileMediaInput {
  id?: string;
  _id?: unknown;
  originalName?: string;
  mimeType?: string;
  path?: string;
}

export class UserResource {
  static toJson(user: User & { _id?: unknown; id?: string }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  /** Shared shape used by login, register, and profile endpoints (no token). */
  static profile(
    user: User & { _id?: unknown; id?: string },
    media?: ProfileMediaInput | null,
  ) {
    const id = user.id ?? String(user._id ?? '');
    return {
      id,
      name: user.name ?? '',
      email: user.email ?? '',
      phone: user.phone ?? null,
      role: user.role ?? null,
      profileImage: media
        ? {
          id: media.id ?? String(media._id ?? ''),
          originalName: media.originalName ?? '',
          mimeType: media.mimeType ?? '',
          path: normalizeMediaPath(media.path),
        }
        : null,
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
