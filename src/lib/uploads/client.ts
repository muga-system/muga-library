export async function uploadImage(file: File, kind: "avatar" | "cover") {
  const form = new FormData()
  form.set("file", file)
  form.set("kind", kind)
  const response = await fetch("/api/uploads", { method: "POST", body: form })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || "UPLOAD_FAILED")
  return body.url as string
}
