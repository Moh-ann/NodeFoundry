import { Request } from "express"
import ApiKeyDoc from "../models/apiKeyModel"

declare interface PublicRequest extends Request {
  apiKey?: ApiKeyDoc
}

