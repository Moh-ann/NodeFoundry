import { ApiKeyModel } from "../models/ApiKeyModel.js"
import type { ApiKey } from "../models/ApiKeyModel.js"

async function findByKey(key: string): Promise<ApiKey | null> {
  return ApiKeyModel.findOne({ key, status: true }).lean()
}

export { findByKey }