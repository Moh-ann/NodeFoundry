import type { RequestHandler } from "express"
import type { PublicRequest } from "../types/app-request.d.js"
import { ForbiddenError } from "../core/CustomError.js"
import type { Permission } from "../models/ApiKeyModel.js"

function permission(permission: Permission): RequestHandler {
  return (req: PublicRequest, res, next) => {
    try {
      if (!req.apiKey?.permissions) {
        return next(new ForbiddenError("Permission Denied"))
      }

      const exists = req.apiKey.permissions.includes(permission as Permission)
      if (!exists) {
        return next(new ForbiddenError("Permission Denied"))
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

export default permission