import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["test/setup.ts"],
    isolate: false,
    hookTimeout: 6000000,
    testTimeout: 60000
  }
})