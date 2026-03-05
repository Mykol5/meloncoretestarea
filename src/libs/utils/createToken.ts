import * as jwt from 'jsonwebtoken';

export const createToken = (id: any, role: string) => {
  const token = jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: 6 * 60 * 60, // 6 hours in seconds
  });
  return token;
};
