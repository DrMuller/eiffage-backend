import { ObjectId } from "mongodb";

export const Roles = ['USER', 'ADMIN'] as const;
export type Role = (typeof Roles)[number];

export interface User {
  _id: ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  marketingOptIn: boolean;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
}
