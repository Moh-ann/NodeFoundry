import { Request } from "express"
import ApiKeyDoc from "../models/apiKeyModel"
import type KeyStoreDoc from "../models/KeyStoreModel.ts"
import type { UserDoc } from "../models/userModel.ts"

declare interface PublicRequest extends Request {
  apiKey?: ApiKeyDoc
}

declare interface ProtectedRequest extends Request {
  user: UserDoc
  accessToken: string
  keystore: KeyStoreDoc
}
