import { useState, useEffect, useCallback } from 'react'

interface PingStats {
  latency: number
  status: 'connected' | 'disconnected' | 'reconnecting'
  lastPing: number
  lastPong: number
}

interface PingMonitorData {
  sh: PingStats
  en: PingStats
}

interface PingIntervals {
  sh: number
  en: number
  ui: number
}

export function usePingMonitor(url: string = 'ws://localhost:8000') {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [pingData, setPingData] = useState<PingMonitorData>({
    sh: { latency: 0, status: 'disconnected', lastPing: 0, lastPong: 0 },
    en: { latency: 0, status: 'disconnected', lastPing: 0, lastPong: 0 }
  })
  const [error, setError] = useState<string | null>(null)
  const [pingIntervals, setPingIntervals] = useState<PingIntervals>({
    sh: 1000,  // 1 second
    en: 1000,  // 1 second  
    ui: 100    // 100ms
  })

  const updatePingInterval = useCallback((intervals: Partial<PingIntervals>) => {
    setPingIntervals(prev => {
      const newIntervals = { ...prev, ...intervals }
      
      // Debug logging
      console.log('🔧 Updating ping intervals:', { old: prev, new: newIntervals })
      
      // If Engine ping interval is being updated, send it via WebSocket
      if (intervals.en && socket && socket.readyState === WebSocket.OPEN) {
        const message = {
          type: 'ping_interval_update',
          interval_ms: intervals.en,
          'msg-sent-timestamp': new Date().toISOString()
        }
        socket.send(JSON.stringify(message))
        console.log('📡 Sent Engine ping interval update:', intervals.en + 'ms')
      }
      
      return newIntervals
    })
  }, [socket])

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url)

      ws.onopen = () => {
        console.log('🔗 Connected to StreamHandler for ping monitoring')
        setIsConnected(true)
        setError(null)
        
        // Start sending pings only to SH (EN ping is handled via negotiation)
        sendPing(ws, 'sh')
      }

      ws.onclose = () => {
        console.log('🔌 Disconnected from StreamHandler')
        setIsConnected(false)
        setPingData(prev => ({
          sh: { ...prev.sh, status: 'disconnected' },
          en: { ...prev.en, status: 'disconnected' }
        }))
        
        // Attempt reconnection after 5 seconds
        setTimeout(() => {
          setPingData(prev => ({
            sh: { ...prev.sh, status: 'reconnecting' },
            en: { ...prev.en, status: 'reconnecting' }
          }))
          connect()
        }, 5000)
      }

      ws.onerror = (event) => {
        console.error('WebSocket error:', event)
        setError('Connection error')
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          // Handle SH pong responses
          if (message.type === 'pong' && message.target === 'sh') {
            const timestamp = parseFloat(message.timestamp)
            const now = Date.now()
            
            if (!isNaN(timestamp) && timestamp > 0) {
              const latency = Math.max(0, now - timestamp)
              
              setPingData(prev => ({
                ...prev,
                sh: {
                  ...prev.sh,
                  latency: latency,
                  status: 'connected' as const,
                  lastPong: now
                }
              }))
            }
          }
          
          // Handle negotiation messages to extract Engine ping data
          else if (message.type === 'negotiation' && message.data) {
            const engineSystem = message.data['__engine_system__']
            if (engineSystem && engineSystem.streams && engineSystem.streams.engine_ping) {
              const pingStream = engineSystem.streams.engine_ping
              const latency = pingStream.value || 0
              const connectionStatus = pingStream.connection_status || 'disconnected'
              
              setPingData(prev => ({
                ...prev,
                en: {
                  ...prev.en,
                  latency: latency,
                  status: connectionStatus === 'connected' ? 'connected' : 'disconnected',
                  lastPong: Date.now()
                }
              }))
            }
          }
        } catch (error) {
          console.error('Failed to parse ping message:', error)
        }
      }

      setSocket(ws)
    } catch (error) {
      console.error('Failed to connect:', error)
      setError('Failed to connect')
    }
  }, [url])

  const sendPing = useCallback((ws: WebSocket, target: 'sh') => {
    if (ws.readyState === WebSocket.OPEN) {
      const timestamp = Date.now()
      
      ws.send(JSON.stringify({
        type: 'ping',
        timestamp: timestamp.toString(),
        target,
        status: 'active',
        'msg-sent-timestamp': new Date().toISOString()
      }))
      
      setPingData(prev => ({
        ...prev,
        [target]: {
          ...prev[target],
          lastPing: timestamp
        }
      }))
    }
  }, [])

  // Initial connection
  useEffect(() => {
    connect()
    return () => {
      if (socket) {
        socket.close()
      }
    }
  }, [connect])

  // Send periodic pings to SH only and check for timeouts
  useEffect(() => {
    if (!socket || !isConnected) return

    const pingInterval = setInterval(() => {
      sendPing(socket, 'sh')
    }, pingIntervals.sh) // Use configurable interval

    // Check for connection timeouts
    const timeoutInterval = setInterval(() => {
      const now = Date.now()
      const timeout = pingIntervals.sh * 5 // 5x ping interval for timeout
      
      setPingData(prev => ({
        sh: {
          ...prev.sh,
          status: (now - prev.sh.lastPong > timeout && prev.sh.lastPong > 0) ? 'disconnected' : prev.sh.status
        },
        en: {
          ...prev.en,
          status: (now - prev.en.lastPong > timeout && prev.en.lastPong > 0) ? 'disconnected' : prev.en.status
        }
      }))
    }, pingIntervals.ui) // Use UI update interval for checks

    return () => {
      clearInterval(pingInterval)
      clearInterval(timeoutInterval)
    }
  }, [socket, isConnected, sendPing, pingIntervals])

  return {
    isConnected,
    pingData,
    error,
    reconnect: connect,
    updatePingInterval,
    pingIntervals
  }
}
