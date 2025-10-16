import { ObjectId } from "mongodb";

export const Roles = ['USER', 'RH', 'MANAGER', 'ADMIN'] as const;
export type Role = (typeof Roles)[number];

export interface User {
  _id: ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  code: string; // Matricule
  jobId: ObjectId | null;
  managerUserIds: ObjectId[];
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
}