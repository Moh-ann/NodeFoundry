import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    hookTimeout: 6000000,
    testTimeout: 60000
  }
})