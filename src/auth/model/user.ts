import { ObjectId } from "mongodb";

export const Roles = ['USER', 'RH', 'MANAGER', 'ADMIN'] as const;
export type Role = (typeof Roles)[number];

export interface User {
  _id: ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  code: string;
  managerUserId: ObjectId | null;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
}