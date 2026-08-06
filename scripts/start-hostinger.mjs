import { createRequire } from "node:module"
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { spawn } from "node:child_process"

const require = createRequire(import.meta.url)
const nextPackage = require.resolve("next/package.json")
const nextRoot = dirname(nextPackage)
const metadataDirectory = join(nextRoot, "dist", "lib", "metadata")

mkdirSync(metadataDirectory, { recursive: true })
writeFileSync(
  join(metadataDirectory, "get-metadata-route.js"),
  '"use strict"\nexports.normalizeMetadataRoute = (route) => route\n',
)
writeFileSync(
  join(metadataDirectory, "is-metadata-route.js"),
  '"use strict"\nexports.isMetadataRouteFile = () => false\n',
)

const nextCli = join(nextRoot, "dist", "bin", "next")
const child = spawn(process.execPath, [nextCli, "start"], {
  env: process.env,
  stdio: "inherit",
})

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal))
}

child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0))
})
