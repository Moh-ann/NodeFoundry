import express, { type NextFunction, type Request, type Response } from "express"
import type { ZodSchema } from "zod"
import validator, { ValidationSource } from "../helpers/validator.js"
import schema from "./schema.js"
import JWT from "../core/JWT.js"
import { tokenInfo } from "../config.js"
import User from "../models/userModel.js"
import { Types } from "mongoose"
import { BadRequestError, TokenExpiredError } from "../core/CustomError.js"
import { KeyStoreModel } from "../models/KeyStoreModel.js"
import asyncHandler from "../helpers/asyncHandler.js"
import type { ProtectedRequest } from "../types/app-request.js"
import { validateTokenData } from "./utils.js"

const router = express.Router()

export default router.use(
  asyncHandler(
    async (req: ProtectedRequest, res: Response, next: NextFunction) => {
      try {
        const payload = await JWT.validate(
          req.cookies.accessToken,
          tokenInfo.secret
        )
        validateTokenData(payload)

        const user = await User.findById(new Types.ObjectId(payload.sub))

        if (!user) throw new BadRequestError("User does not exist")
        req.user = user

        const keystore = await KeyStoreModel.findOne({
          client: req.user,
          primaryKey: payload.prm,
          status: true,
        })

        if (!keystore) throw new BadRequestError("Invalid access token")
        req.keystore = keystore

        next()
      } catch (error) {
        throw new TokenExpiredError("Token expired")
      }
    }
  )
)