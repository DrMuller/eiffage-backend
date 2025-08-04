import { ObjectId } from "mongodb";

export interface RefreshToken {
  _id: ObjectId;
  userId: ObjectId;
  refreshToken: string;
  createdAt: Date;
  expiresAt: Date;
}
