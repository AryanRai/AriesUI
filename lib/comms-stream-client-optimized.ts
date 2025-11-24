// CommsStreamClient Optimized - Enhanced WebSocket client with built-in message batching
// This is a reference implementation showcasing the MessageBatcher in isolation
// The main CommsStreamClient in comms-stream-client.ts already includes this batching functionality

/**
 * MessageBatcher - Batches stream updates to reduce re-render storms
 * 
 * Features:
 * - Collects stream updates in a queue
 * - Flushes queue using requestAnimationFrame (syncs with browser refresh rate, typically ~60fps)
 * - Deduplicates updates by streamId (last update wins)
 * - Can be disabled for immediate updates
 * 
 * Usage:
 * ```typescript
 * const batcher = new MessageBatcher(true)
 * 
 * batcher.onFlush((batch) => {
 *   batch.forEach((data, streamId) => {
 *     console.log(`Stream ${streamId} updated:`, data)
 *   })
 * })
 * 
 * batcher.add('stream1', { value: 42 })
 * batcher.add('stream2', { value: 100 })
 * // Both updates will be batched and flushed together in next frame
 * ```
 */
export class MessageBatcher {
  private queue: Map<string, any> = new Map()
  private rafId: number | null = null
  private callbacks: Set<(batch: Map<string, any>) => void> = new Set()
  private enabled: boolean = true

  constructor(enabled: boolean = true) {
    this.enabled = enabled
  }

  /**
   * Add a stream update to the batch queue
   * @param streamId - Unique identifier for the stream
   * @param data - Stream data to be batched
   */
  add(streamId: string, data: any) {
    if (!this.enabled) {
      // If batching disabled, notify immediately
      const batch = new Map([[streamId, data]])
      this.callbacks.forEach(cb => cb(batch))
      return
    }

    // Queue the update (overwrites previous update for same streamId)
    this.queue.set(streamId, data)
    this.scheduleFlush()
  }

  /**
   * Schedule a flush using requestAnimationFrame
   * Only schedules if not already scheduled
   */
  private scheduleFlush() {
    if (this.rafId !== null) return
    
    this.rafId = requestAnimationFrame(() => {
      this.flush()
      this.rafId = null
    })
  }

  /**
   * Flush the queue and notify all callbacks
   */
  private flush() {
    if (this.queue.size === 0) return
    
    // Create a snapshot of the queue
    const batch = new Map(this.queue)
    this.queue.clear()
    
    // Notify all callbacks with the batch
    this.callbacks.forEach(cb => cb(batch))
  }

  /**
   * Register a callback to be called when batch is flushed
   * @param callback - Function to call with batched updates
   * @returns Unsubscribe function
   */
  onFlush(callback: (batch: Map<string, any>) => void) {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  /**
   * Enable or disable batching
   * @param enabled - Whether to enable batching
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
    // If disabling while there are queued items, flush them immediately
    if (!enabled && this.queue.size > 0) {
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId)
        this.rafId = null
      }
      this.flush()
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.queue.clear()
    this.callbacks.clear()
  }

  /**
   * Get current queue size
   */
  get queueSize(): number {
    return this.queue.size
  }

  /**
   * Check if batching is enabled
   */
  get isBatchingEnabled(): boolean {
    return this.enabled
  }
}

/**
 * Example usage:
 * 
 * // In your WebSocket client
 * const batcher = new MessageBatcher(true)
 * 
 * // Set up flush handler
 * batcher.onFlush((batch) => {
 *   batch.forEach((streamData, streamId) => {
 *     // Update your state/store/listeners
 *     updateStreamValue(streamId, streamData)
 *   })
 * })
 * 
 * // In your message handler
 * ws.onmessage = (event) => {
 *   const message = JSON.parse(event.data)
 *   
 *   if (message.type === 'stream_update') {
 *     Object.entries(message.data).forEach(([streamId, streamData]) => {
 *       batcher.add(streamId, streamData)
 *     })
 *   }
 * }
 * 
 * // Cleanup when done
 * batcher.destroy()
 */
