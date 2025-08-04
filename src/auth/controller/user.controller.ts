import { Request, Response } from "express";
import { getMe } from "../service/auth.service";
import { asyncHandler } from "../../utils/express/asyncHandler";

export const me = asyncHandler(async (req: Request, res: Response) => {
  const { _id } = req.context.user;
  const user = await getMe(_id);
  res.status(200).json(user);
});