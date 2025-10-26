import { createContext, useContext, useEffect, useState } from 'react'

const WebSocketContext = createContext()

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  const connect = () => {
    try {
      const ws = new WebSocket('ws://localhost:5002/ws')
      
      ws.onopen = () => {
        setIsConnected(true)
        setReconnectAttempts(0)
        console.log('WebSocket connected')
      }
      
      ws.onclose = () => {
        setIsConnected(false)
        setSocket(null)
        
        // Auto-reconnect with exponential backoff
        if (reconnectAttempts < 5) {
          const delay = Math.pow(2, reconnectAttempts) * 1000
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1)
            connect()
          }, delay)
        }
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
      
      setSocket(ws)
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
    }
  }

  const disconnect = () => {
    if (socket) {
      socket.close()
      setSocket(null)
      setIsConnected(false)
    }
  }

  const sendMessage = (message) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message))
    }
  }

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [])

  const value = {
    socket,
    isConnected,
    connect,
    disconnect,
    sendMessage
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}