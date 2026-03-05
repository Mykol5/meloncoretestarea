import * as bcrypt from 'bcryptjs';

export class PasswordEncoder {
  static hash(password: string) {
    return bcrypt.hash(password, 10);
  }

  static compare(password: string, hashedPassword: string) {
    return bcrypt.compare(password, hashedPassword);
  }
}
