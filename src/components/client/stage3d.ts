'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'

/** True once the element has come within 300px of the viewport. */
export function useWhenVisible<T extends Element>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setSeen(true)
        io.disconnect()
      }
    }, { rootMargin: '300px' })
    io.observe(el)
    return () => io.disconnect()
  }, [seen])
  return [ref, seen]
}

/** Scale that fits a stage drawn at `width` px into its container (never above 1). */
export function useStageScale<T extends HTMLElement>(width: number): [RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setScale(Math.min(1, w / width))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [width])
  return [ref, scale]
}
