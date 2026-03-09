import { Request } from "express"
import ApiKeyDoc from "../models/ApiKeyModel.ts"
import type KeyStoreDoc from "../models/KeyStoreModel.ts"
import type { UserDoc } from "../models/userModel.ts"
import { RoleCode } from "../models/roleModel.ts"  

declare interface PublicRequest extends Request {
  apiKey?: ApiKeyDoc
}

declare interface ProtectedRequest extends Request {
  user: UserDoc
  accessToken: string
  keystore: KeyStoreDoc
}

declare interface RoleRequest extends ProtectedRequest {
  currentRoleCodes: RoleCode[]
}
