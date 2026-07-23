"use client"

import { BookOpen } from "lucide-react"
import { useState } from "react"

export function BookCoverImage({
  src,
  alt,
  fallbackSrc,
  className,
}: {
  src: string
  alt: string
  fallbackSrc?: string
  className?: string
}) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc)
  const [failedPrimary, setFailedPrimary] = useState(false)
  const [showFallback, setShowFallback] = useState(!src && !fallbackSrc)

  if (showFallback) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 bg-slate-50 text-slate-500 ${className || ""} dark:bg-slate-900 dark:text-slate-400`} role="img" aria-label={alt}>
        <div className="rounded-full border border-slate-300 bg-slate-100 p-3 dark:border-slate-700 dark:bg-slate-800">
          <BookOpen className="h-8 w-8" />
        </div>
        <span className="px-3 text-center text-xs font-medium uppercase tracking-wider">Sin portada</span>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (!failedPrimary && fallbackSrc && currentSrc !== fallbackSrc) {
          setFailedPrimary(true)
          setCurrentSrc(fallbackSrc)
          return
        }
        setShowFallback(true)
      }}
    />
  )
}
