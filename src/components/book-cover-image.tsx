"use client"

import { useMemo, useState } from "react"

export function BookCoverImage({
  src,
  alt,
  fallbackSrc,
  className,
}: {
  src: string
  alt: string
  fallbackSrc: string
  className?: string
}) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc)
  const [failedPrimary, setFailedPrimary] = useState(false)

  const finalFallback = useMemo(() => {
    return (
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='640' viewBox='0 0 480 640'>` +
          `<rect width='480' height='640' rx='20' fill='#E2E8F0'/>` +
          `<rect x='60' y='80' width='360' height='480' rx='16' fill='#CBD5E1'/>` +
          `<text x='240' y='450' text-anchor='middle' fill='#64748B' font-family='Arial, sans-serif' font-size='20'>Sin portada</text>` +
        `</svg>`,
      )
    )
  }, [])

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (!failedPrimary && fallbackSrc && currentSrc !== fallbackSrc) {
          setFailedPrimary(true)
          setCurrentSrc(fallbackSrc)
          return
        }
        setCurrentSrc(finalFallback)
      }}
    />
  )
}
