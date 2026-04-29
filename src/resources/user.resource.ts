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
}
