"use client"

import { useEffect, useState, useRef, RefObject } from 'react'

interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  root?: Element | null
  rootMargin?: string
  freezeOnceVisible?: boolean
}

interface UseIntersectionObserverReturn {
  isIntersecting: boolean
  entry: IntersectionObserverEntry | null
}

export function useIntersectionObserver(
  elementRef: RefObject<Element>,
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0%',
    freezeOnceVisible = false
  } = options

  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const frozen = useRef(false)

  useEffect(() => {
    const element = elementRef.current
    const hasIOSupport = !!window.IntersectionObserver

    if (!hasIOSupport || frozen.current || !element) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]: IntersectionObserverEntry[]) => {
        setEntry(entry)
        setIsIntersecting(entry.isIntersecting)

        if (freezeOnceVisible && entry.isIntersecting) {
          frozen.current = true
        }
      },
      { threshold, root, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [elementRef, threshold, root, rootMargin, freezeOnceVisible])

  return { isIntersecting, entry }
}
