import { isAbsolute, join } from "node:path"

export function getUploadsDirectory() {
  const configured = process.env.UPLOADS_DIR || "data/uploads"
  return isAbsolute(configured) ? configured : join(process.cwd(), configured)
}
