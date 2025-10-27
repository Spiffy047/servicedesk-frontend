import { createContext, useContext, useEffect, useState, useRef } from 'react'

const WebSocketContext = createContext()

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider')
  }
  return context
}

export const WebSocketProvider = ({ children, user }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState(new Map())
  const socketRef = useRef(null)

  const connect = () => {
    if (!user) return

    const ws = new WebSocket(`ws://localhost:5002/ws?user_id=${user.id}`)
    
    ws.onopen = () => setIsConnected(true)
    ws.onclose = () => setIsConnected(false)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'typing_start') {
        setTypingUsers(prev => new Map(prev.set(data.user_id, data.user_name)))
      } else if (data.type === 'typing_stop') {
        setTypingUsers(prev => {
          const newMap = new Map(prev)
          newMap.delete(data.user_id)
          return newMap
        })
      }
    }

    socketRef.current = ws
  }

  const emitTyping = (ticketId, isTyping) => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(JSON.stringify({
        type: isTyping ? 'typing_start' : 'typing_stop',
        ticket_id: ticketId,
        user_id: user.id,
        user_name: user.name
      }))
    }
  }

  useEffect(() => {
    if (user) connect()
    return () => socketRef.current?.close()
  }, [user])

  return (
    <WebSocketContext.Provider value={{ isConnected, typingUsers, emitTyping }}>
      {children}
    </WebSocketContext.Provider>
  )
}