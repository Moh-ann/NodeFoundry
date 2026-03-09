import type { NextFunction, Request, Response } from "express"
import { RoleCode } from "../models/roleModel.js"
import type { RoleRequest } from "../types/app-request.js"

export default (...roleCodes: RoleCode[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const roleReq = req as RoleRequest;
    roleReq.currentRoleCodes = roleCodes
    next()
  }