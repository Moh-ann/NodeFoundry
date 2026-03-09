import { Types } from "mongoose"
import { RoleCode, RoleModel } from "../models/roleModel.js"
import { InternalError } from "../core/CustomError.js"

async function getRole(role: RoleCode): Promise<Types.ObjectId | null> {
  try {
    const userRole = await RoleModel.findOne({
      code: role,
      status: true,
    })
    if (!userRole) throw new InternalError(" User role not found")
    return userRole._id
  } catch (error) {
    console.log(error)
    throw new InternalError(" User role not found")
  }
}

export default getRole