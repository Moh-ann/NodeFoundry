import { it, describe, expect, vi, beforeEach } from "vitest"
import request from "supertest"
import app from "../../src/app.js"

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
      email: "john@example.com",
    })
    expect(res.body._id).toBeDefined()
  })
})