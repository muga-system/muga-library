import { NextResponse } from "next/server"

function normalizeIsbn(value: string): string {
  return value.replace(/[^0-9Xx]/g, "").toUpperCase()
}

function toOpenLibraryIsbnCover(isbn: string) {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`
}

function toOpenLibraryIdCover(coverId: number) {
  return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg?default=false`
}

function toGoogleBooksQuery(title: string, author: string, isbn: string) {
  const parts: string[] = []
  if (isbn) parts.push(`isbn:${isbn}`)
  if (title) parts.push(`intitle:${title}`)
  if (author) parts.push(`inauthor:${author}`)
  return parts.join("+")
}

const DEFAULT_BOOK_ICON = "https://openlibrary.org/images/icons/avatar_book-sm.png"

async function canUseImageUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      next: { revalidate: 60 * 60 * 24 },
    })

    if (!res.ok) return false
    const contentType = res.headers.get("content-type") || ""
    return contentType.startsWith("image/")
  } catch {
    return false
  }
}

function fallbackSvgResponse() {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="640" viewBox="0 0 480 640" fill="none">
  <rect width="480" height="640" rx="20" fill="#E2E8F0"/>
  <rect x="60" y="80" width="360" height="480" rx="16" fill="#CBD5E1"/>
  <path d="M165 278C165 266.954 173.954 258 185 258H295C306.046 258 315 266.954 315 278V362C315 373.046 306.046 382 295 382H185C173.954 382 165 373.046 165 362V278Z" fill="#94A3B8"/>
  <path d="M209 258V382" stroke="#E2E8F0" stroke-width="10"/>
  <text x="240" y="450" text-anchor="middle" fill="#64748B" font-family="Arial, sans-serif" font-size="20">Sin portada</text>
</svg>`.trim()

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=86400, s-maxage=86400",
    },
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawTitle = (searchParams.get("title") || "").trim()
  const rawAuthor = (searchParams.get("author") || "").trim()
  const rawIsbn = (searchParams.get("isbn") || "").trim()
  const isbn = normalizeIsbn(rawIsbn)

  const queryTitle = rawTitle.slice(0, 150)
  const queryAuthor = rawAuthor.slice(0, 150)

  try {
    if (queryTitle) {
      const params = new URLSearchParams({
        title: queryTitle,
        limit: "5",
      })

      if (queryAuthor) {
        params.set("author", queryAuthor)
      }

      const res = await fetch(`https://openlibrary.org/search.json?${params.toString()}`, {
        next: { revalidate: 60 * 60 * 24 },
      })

      if (res.ok) {
        const data = await res.json()
        const docs = Array.isArray(data?.docs) ? data.docs : []
        const withCover = docs.find((doc: any) => typeof doc?.cover_i === "number")

        if (withCover?.cover_i) {
          const coverUrl = toOpenLibraryIdCover(withCover.cover_i)
          const valid = await canUseImageUrl(coverUrl)
          if (valid) {
            return NextResponse.redirect(coverUrl, {
              status: 302,
              headers: {
                "cache-control": "public, max-age=86400, s-maxage=86400",
              },
            })
          }
        }
      }
    }

    if (isbn) {
      const coverUrl = toOpenLibraryIsbnCover(isbn)
      const valid = await canUseImageUrl(coverUrl)
      if (valid) {
        return NextResponse.redirect(coverUrl, {
          status: 302,
          headers: {
            "cache-control": "public, max-age=86400, s-maxage=86400",
          },
        })
      }
    }

    const gbQuery = toGoogleBooksQuery(queryTitle, queryAuthor, isbn)
    if (gbQuery) {
      const gbRes = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(gbQuery)}&maxResults=5&printType=books`,
        { next: { revalidate: 60 * 60 * 24 } },
      )

      if (gbRes.ok) {
        const gbData = await gbRes.json()
        const items = Array.isArray(gbData?.items) ? gbData.items : []
        const candidate = items
          .map((item: any) => item?.volumeInfo?.imageLinks?.thumbnail || item?.volumeInfo?.imageLinks?.smallThumbnail)
          .find((url: string | undefined) => Boolean(url))

        if (candidate) {
          const coverUrl = String(candidate).replace(/^http:\/\//i, "https://")
          const valid = await canUseImageUrl(coverUrl)
          if (valid) {
            return NextResponse.redirect(coverUrl, {
              status: 302,
              headers: {
                "cache-control": "public, max-age=86400, s-maxage=86400",
              },
            })
          }
        }
      }
    }
  } catch {
    // ignore and fallback below
  }

  const validDefault = await canUseImageUrl(DEFAULT_BOOK_ICON)
  if (validDefault) {
    return NextResponse.redirect(DEFAULT_BOOK_ICON, {
      status: 302,
      headers: {
        "cache-control": "public, max-age=86400, s-maxage=86400",
      },
    })
  }

  return fallbackSvgResponse()
}
