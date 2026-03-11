import { it, describe, expect, beforeAll, beforeEach, afterAll} from "vitest"
import request from "supertest"
import app from "../../src/app.js"
import {MongoMemoryServer} from "mongodb-memory-server"
import mongoose from "mongoose"
import { RoleModel } from "../../src/models/roleModel.js"
import JWT from "../../src/core/JWT.js"
import { tokenInfo } from "../../src/config.js"

let mongo: any

beforeAll(async ()=> {
    mongo = await MongoMemoryServer.create()
    const mongoUri = mongo.getUri()
    await mongoose.connect(mongoUri)
}) 

beforeEach(async () => {
  const collections = await mongoose.connection?.db?.collections()
  
  if (!collections) return
  for (let collection of collections) {
    await collection.deleteMany({})
  }
  await RoleModel.create({
      code: "USER",
      status: true,
    })
})

afterAll(async () => {
    if (mongo) {
        await mongo.stop()
    }
    await mongoose.connection.close()
})

describe("Tests the register functionality", () => {
 
  const endpoint = "/api/users/register"
  const userPayload = {
    name: "John",
    email: "john@example.com",
    password: "123456",
  }

  it("should register a user", async () => {
    
    const res = await request(app).post(endpoint).send(userPayload)

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      name: "John",
      email: "john@example.com"
    })
    expect(res.body._id).toBeDefined()
  })

  it("returns 400 with invailid email", async () => {
    const res = await request(app).post(endpoint).send({
      name: "John",
      email: "slidjfisjdf",
      password: "123456",
    })
    expect(res.status).toBe(400)
  })

  it("returns a 400 with missing email and password", async () => {
    return request(app).post(endpoint).send({}).expect(400)
  })

  it("disallows duplicate emails", async () => {
    await request(app)
      .post(endpoint)
      .send(userPayload)
      .expect(201)

    await request(app)
      .post(endpoint)
      .send(userPayload)
      .expect(400)
  })

  it("should set accessToken and refreshToken cookies on successful registration",
  async () => {
    const res = await request(app).post(endpoint).send(userPayload).expect(201)

    expect(res.headers["set-cookie"]).toBeDefined()
    const cookies = Array.isArray(res.headers["set-cookie"])
      ? res.headers["set-cookie"]
      : []
    expect(
      cookies.some((cookie: string) => cookie.startsWith("accessToken="))
    ).toBe(true)
    expect(
      cookies.some((cookie: string) => cookie.startsWith("refreshToken="))
    ).toBe(true)
  })

  it("should generate tokens with the correct payload", async () => {
    const res = await request(app).post(endpoint).send(userPayload)

    const cookies = Array.isArray(res.headers["set-cookie"])
      ? res.headers["set-cookie"]
      : []

    const accessTokenCookie = cookies.find((cookie: string) =>
      cookie.startsWith("accessToken=")
    )
    const refreshTokenCookie = cookies.find((cookie: string) =>
      cookie.startsWith("refreshToken=")
    )

    expect(accessTokenCookie).toBeDefined()
    expect(refreshTokenCookie).toBeDefined()

    const accessToken = accessTokenCookie?.split(";")[0].split("=")[1]
    const refreshToken = refreshTokenCookie?.split(";")[0].split("=")[1]

    const decodedAccessToken = await JWT.decode(accessToken!)
    const decodedRefreshToken = await JWT.decode(refreshToken!)

    expect(decodedAccessToken.sub).toBeDefined()
    expect(decodedAccessToken.iss).toBe(tokenInfo.issuer)
    expect(decodedAccessToken.aud).toBe(tokenInfo.audience)

    expect(decodedRefreshToken.sub).toBeDefined()
    expect(decodedRefreshToken.iss).toBe(tokenInfo.issuer)
    expect(decodedRefreshToken.aud).toBe(tokenInfo.audience)
  })
})