import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/AsyncHandler";
import UserModel, { User } from "../models/user.model";
import { NextFunction, Request, Response } from "express";

interface AuthenticatedRequest extends Request {
  user?: User;
}

export const verifyJwtToken = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const token: string | undefined =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        throw new ApiError(401, "Unauthorized Request");
      }

      const decodedToken: any = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string
      );

      const user: User | null = await UserModel.findById(decodedToken?._id)
        .select("-password -refreshToken")
        .lean()
        .exec();

      if (!user) {
        throw new ApiError(401, "Invalid Access Token");
      }

      req.user = user;
      next();
    } catch (error: any) {
      throw new ApiError(401, error?.message || "Invalid Access Token");
    }
  }
);
