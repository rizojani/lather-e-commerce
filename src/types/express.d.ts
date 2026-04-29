import { Role } from '../common/types/roles.enum';

declare global {
  namespace Express {
    interface User {
      sub: string;
      email: string;
      role: Role;
      id?: string;
    }
  }
}

export {};
