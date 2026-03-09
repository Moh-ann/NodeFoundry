import express, { type NextFunction, type Request, type Response } from "express"
import asyncHandler from "../helpers/asyncHandler.js"
import { BadRequestError, ForbiddenError } from "../core/CustomError.js"
import type { RoleRequest } from "../types/app-request.d.js"
import { RoleModel } from "../models/roleModel.js"

const router = express.Router()

export default router.use(
  asyncHandler(async (req: RoleRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.roles || !req.currentRoleCodes) {
      throw new ForbiddenError("Permission Denied")
    }

    const roles = await RoleModel.find({
      code: {
        $in: req.currentRoleCodes,
      },
      status: true,
    })

    if (!roles.length) throw new ForbiddenError("Permission Denied")

        const roleids = roles.map(role => role._id.toString())

    let authorized = false

    for (const userRole of req.user.roles) {
  const id =
    typeof userRole === "object" && userRole._id
      ? userRole._id.toString()
      : userRole.toString()

  if (roleids.includes(id)) {
    authorized = true
    break
  }
}

    if (!authorized) throw new ForbiddenError("Permission Denied")

    return next()
  })
)