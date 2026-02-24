import validator, { ValidationSource } from "../helpers/validator.js"
import express, { type NextFunction, type Response } from "express"
import apiKeySchema from "./schema.js"
import { Header } from "./utils.js"
import { ForbiddenError } from "../core/CustomError.js"
import { findByKey } from "../controllers/apiKeyController.js"
import type { PublicRequest } from "../types/app-request.d.js"

const router = express.Router()

export default router.use(
  validator(apiKeySchema.apiKey, ValidationSource.HEADER),

  async (req: PublicRequest, res: Response, next: NextFunction) => {
    const key = req.headers[Header.API_KEY]?.toString()
    if (!key) return next(new ForbiddenError())

    const apiKey = await findByKey(key)
    console.log("🚀 ~ apiKey:", apiKey)

    if (!apiKey) return next(new ForbiddenError())
    req.apiKey = apiKey
    return next()
  }
)