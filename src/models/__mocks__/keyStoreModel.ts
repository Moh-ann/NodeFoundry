import { vi, type Mock } from "vitest"

const keyStoreModelMock = {
  findOne: vi.fn(),
  create: vi.fn()
}

export default keyStoreModelMock
export const keyStoreModel = keyStoreModelMock
