import { it, describe, expect, beforeAll, beforeEach, afterAll, vi} from "vitest"
import { create as keyStoreControllerCreate } from "../../src/controllers/KeyStoreController.js"
import request from "supertest"
import app from "../../src/app.js"
import mongoose, { Types } from "mongoose"
import { RoleCode, RoleModelMock } from "../../src/models/__mocks__/roleModel.js"
import UserModelMock from "../../src/models/__mocks__/UserModel.js"
import keyStoreModelMock from "../../src/models/__mocks__/keyStoreModel.js"
import JWT from "../../src/core/JWT.js"
import { tokenInfo } from "../../src/config.js"

vi.mock("../../src/models/userModel")
vi.mock("../../src/models/roleModel")
vi.mock("../../src/models/keyStoreModel")

vi.mock("../../src/controllers/KeyStoreController.js", () => ({
  create: vi.fn().mockResolvedValue({}),
}))

vi.mock("../../src/auth/utils.js", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    createTokens: vi.fn().mockResolvedValue({
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
    }),
    getAccessToken: vi.fn(),
    validateTokenData: vi.fn(),
  }
})

describe("Tests the register functionality", () => {

  beforeEach(() => {
  vi.clearAllMocks()
  })
 
  const endpoint = "/api/users/register"
  const userPayload = {
    name: "John",
    email: "john@example.com",
    password: "123456",
  }

  it("should register a user", async () => {
    const mockId = new mongoose.Types.ObjectId()
    RoleModelMock.findOne.mockResolvedValue({
      _id: mockId,
      code: RoleCode.USER,
      status: true,
    })
    UserModelMock.create.mockResolvedValue({
        _id: mockId,
        name: userPayload.name,
        email: userPayload.email,
    })
    keyStoreModelMock.create.mockResolvedValue({
      _id: mockId,
      client: mockId,
      primaryKey: expect.any(String),
      secondaryKey: expect.any(String),
    })

    const res = await request(app).post(endpoint).send(userPayload)

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      name: userPayload.name,
      email: userPayload.email,
    })
    expect(res.body._id).toBeDefined()
    expect(UserModelMock.findOne).toHaveBeenCalledWith({
      email: userPayload.email,
    })
    expect(RoleModelMock.findOne).toHaveBeenCalledWith({
      code: RoleCode.USER,
      status: true,
    })
    expect(keyStoreControllerCreate).toHaveBeenCalled()
  })

  it("should not register if user already exists", async () => {
    UserModelMock.findOne.mockResolvedValue({
      _id: new Types.ObjectId(),
      name: userPayload.name,
      email: userPayload.email,
    })

    const res = await request(app).post(endpoint).send(userPayload)

    expect(res.status).toBe(400)
    expect(res.body.message).toBe("User already exists")
    expect(UserModelMock.create).not.toHaveBeenCalled()
    expect(RoleModelMock.findOne).not.toHaveBeenCalled()
    expect(keyStoreModelMock.create).not.toHaveBeenCalled()
  })

  it("should return 400 with an invalid email", async () => {
    const invalidPayload = { ...userPayload, email: "invalid-email" }

    const response = await request(app).post(endpoint).send(invalidPayload)

    expect(response.status).toBe(400)
    expect(response.body.message).toBe("Inavlid email")
    expect(UserModelMock.findOne).not.toHaveBeenCalled()
    expect(UserModelMock.create).not.toHaveBeenCalled()
    expect(keyStoreModelMock.create).not.toHaveBeenCalled()
  })

  it("should return 400 with an invalid password", async () => {
    const invalidPayload = { ...userPayload, password: "123" }

    const response = await request(app).post(endpoint).send(invalidPayload)

    expect(response.status).toBe(400)
    expect(response.body.message).toBe(
      "Password must be at least 6 characters long"
    )
    expect(UserModelMock.findOne).not.toHaveBeenCalled()
    expect(UserModelMock.create).not.toHaveBeenCalled()
    expect(keyStoreModelMock.create).not.toHaveBeenCalled()
  })

  it("should return 400 with missing email and password", async () => {
    const invalidPayload = { name: userPayload.name }

    const response = await request(app).post(endpoint).send(invalidPayload)

    expect(response.status).toBe(400)
    expect(response.body.message).toMatch(/expected string, received undefined/i)
    expect(UserModelMock.findOne).not.toHaveBeenCalled()
    expect(UserModelMock.create).not.toHaveBeenCalled()
    expect(keyStoreModelMock.create).not.toHaveBeenCalled()
  })

  it("should not set cookies if registration fails due to duplicate email", async () => {
    UserModelMock.findOne.mockResolvedValue({
      _id: "existing_user_id",
      name: "Existing User",
      email: userPayload.email,
    })

    await request(app).post(endpoint).send(userPayload)
    const response = await request(app).post(endpoint).send(userPayload)

    expect(response.status).toBe(400)
    expect(response.headers["set-cookie"]).toBeUndefined()
    expect(UserModelMock.create).not.toHaveBeenCalled()
    expect(keyStoreModelMock.create).not.toHaveBeenCalled()
  })

  it("should set accessToken and refreshToken cookies on successful registration", async () => {
    UserModelMock.findOne.mockResolvedValue(null)
    UserModelMock.create.mockResolvedValue({
      _id: new Types.ObjectId(),
      name: userPayload.name,
      email: userPayload.email,
      roles: [],
    })
    keyStoreModelMock.create.mockResolvedValue({
      accessToken: "access_token",
      refreshToken: "refresh_token",
    })

    const response = await request(app).post(endpoint).send(userPayload)

    expect(response.status).toBe(201)
    expect(response.headers["set-cookie"]).toBeDefined()

    const cookies = Array.isArray(response.headers["set-cookie"])
      ? response.headers["set-cookie"]
      : []

    expect(
      cookies.some((cookie: string) => cookie.startsWith("accessToken="))
    ).toBe(true)
    expect(
      cookies.some((cookie: string) => cookie.startsWith("refreshToken="))
    ).toBe(true)
  })

  it("should generate tokens with the correct payload", async () => {
    UserModelMock.findOne.mockResolvedValue(null)
    UserModelMock.create.mockResolvedValue({
      _id: new Types.ObjectId(),
      name: userPayload.name,
      email: userPayload.email,
      roles: [],
    })
    keyStoreModelMock.create.mockResolvedValue({
      accessToken: "access_token",
      refreshToken: "refresh_token",
    })

    const response = await request(app).post(endpoint).send(userPayload)

    expect(response.status).toBe(201)

    const cookies = Array.isArray(response.headers["set-cookie"])
      ? response.headers["set-cookie"]
      : []

    const accessTokenCookie = cookies.find((cookie: string) =>
      cookie.startsWith("accessToken=")
    )
    const refreshTokenCookie = cookies.find((cookie: string) =>
      cookie.startsWith("refreshToken=")
    )

    const accessToken = accessTokenCookie?.split(";")[0].split("=")[1]
    const refreshToken = refreshTokenCookie?.split(";")[0].split("=")[1]

    expect(accessToken).toBe("mock-access-token")
    expect(refreshToken).toBe("mock-refresh-token")
  })
})