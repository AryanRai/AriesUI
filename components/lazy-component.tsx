"use client"

import React, { useState, useEffect, useRef, useCallback, memo } from 'react'
import { cn } from '@/lib/utils'

interface LazyComponentProps {
  children: React.ReactNode
  placeholder?: React.ReactNode
  rootMargin?: string
  threshold?: number
  className?: string
  fallback?: React.ReactNode
  onVisible?: () => void
  unloadWhenHidden?: boolean
  minHeight?: number
}

/**
 * Lazy loading component that only renders children when visible
 * Supports unloading when hidden to save memory
 */
export const LazyComponent = memo<LazyComponentProps>(({
  children,
  placeholder,
  rootMargin = '100px',
  threshold = 0.1,
  className,
  fallback,
  onVisible,
  unloadWhenHidden = false,
  minHeight = 200
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries
    const visible = entry.isIntersecting

    setIsVisible(visible)
    
    if (visible && !hasBeenVisible) {
      setHasBeenVisible(true)
      setIsLoading(true)
      onVisible?.()
      
      // Simulate loading delay for demonstration
      setTimeout(() => setIsLoading(false), 100)
    }
  }, [hasBeenVisible, onVisible])

  useEffect(() => {
    const element = ref.current
    if (!element) return

    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold
    })

    observerRef.current.observe(element)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [handleIntersection, rootMargin, threshold])

  // Render loading placeholder
  const renderPlaceholder = () => {
    if (placeholder) return placeholder
    
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted/30 rounded-lg animate-pulse",
          className
        )}
        style={{ minHeight }}
      >
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Render fallback for errors
  const renderFallback = () => {
    if (fallback) return fallback
    
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-destructive/10 rounded-lg border border-destructive/20",
          className
        )}
        style={{ minHeight }}
      >
        <div className="text-sm text-destructive">Failed to load</div>
      </div>
    )
  }

  const shouldRender = unloadWhenHidden ? isVisible : hasBeenVisible

  return (
    <div 
      ref={ref} 
      className={cn("relative", className)}
      style={{ minHeight: !shouldRender ? minHeight : undefined }}
    >
      {!shouldRender && renderPlaceholder()}
      {shouldRender && isLoading && renderPlaceholder()}
      {shouldRender && !isLoading && (
        <div className={cn(!isVisible && unloadWhenHidden && "opacity-50 pointer-events-none")}>
          {children}
        </div>
      )}
    </div>
  )
})

LazyComponent.displayName = 'LazyComponent'

/**
 * Higher-order component for lazy loading
 */
export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<LazyComponentProps, 'children'>
) {
  const LazyWrappedComponent = memo((props: P) => (
    <LazyComponent {...options}>
      <Component {...props} />
    </LazyComponent>
  ))

  LazyWrappedComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`
  
  return LazyWrappedComponent
}

/**
 * Lazy list component for rendering large lists efficiently
 */
interface LazyListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  itemHeight?: number
  batchSize?: number
  className?: string
  placeholder?: React.ReactNode
  onEndReached?: () => void
  endReachedThreshold?: number
}

export const LazyList = memo(<T,>({
  items,
  renderItem,
  itemHeight = 100,
  batchSize = 20,
  className,
  placeholder,
  onEndReached,
  endReachedThreshold = 200
}: LazyListProps<T>) => {
  const [visibleCount, setVisibleCount] = useState(batchSize)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container || isLoadingMore) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const scrollBottom = scrollHeight - scrollTop - clientHeight

    // Load more items when near bottom
    if (scrollBottom <= endReachedThreshold && visibleCount < items.length) {
      setIsLoadingMore(true)
      
      // Batch load more items
      setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + batchSize, items.length))
        setIsLoadingMore(false)
        
        // Trigger onEndReached if we've shown all items
        if (visibleCount + batchSize >= items.length) {
          onEndReached?.()
        }
      }, 100)
    }
  }, [visibleCount, items.length, batchSize, endReachedThreshold, onEndReached, isLoadingMore])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const visibleItems = items.slice(0, visibleCount)
  const remainingHeight = (items.length - visibleCount) * itemHeight

  return (
    <div 
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ maxHeight: '100%' }}
    >
      {visibleItems.map((item, index) => (
        <div key={index} style={{ minHeight: itemHeight }}>
          {renderItem(item, index)}
        </div>
      ))}
      
      {/* Spacer for remaining items */}
      {remainingHeight > 0 && (
        <div 
          style={{ height: remainingHeight }}
          className="flex items-center justify-center"
        >
          {isLoadingMore ? (
            placeholder || <div className="text-sm text-muted-foreground">Loading more...</div>
          ) : (
            <div className="text-xs text-muted-foreground opacity-50">
              {items.length - visibleCount} more items
            </div>
          )}
        </div>
      )}
    </div>
  )
})

LazyList.displayName = 'LazyList'
