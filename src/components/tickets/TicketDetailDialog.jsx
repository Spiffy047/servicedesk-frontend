import { useState, useEffect, useRef } from 'react'
import { useWebSocket } from '../../WebSocketContext'
import { validateFileUpload, getFileIcon, formatFileSize } from '../../utils/ticketUtils'

const API_URL = 'http://localhost:5002/api'

export default function TicketDetailDialog({ ticket, onClose, currentUser, onUpdate }) {
  const [messages, setMessages] = useState([])
  const [activities, setActivities] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedTicket, setEditedTicket] = useState(ticket)
  const [agents, setAgents] = useState([])
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const scrollRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const { isConnected, typingUsers, emitTyping } = useWebSocket()

  useEffect(() => {
    fetchMessages()
    fetchActivities()
    fetchAgents()
    fetchAttachments()
  }, [ticket.id])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, activities])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/messages/ticket/${ticket.id}/timeline`)
      const data = await response.json()
      setMessages(Array.isArray(data) ? data : data.messages || [])
    } catch (err) {
      setMessages([])
    }
  }

  const fetchActivities = async () => {
    try {
      const response = await fetch(`${API_URL}/tickets/${ticket.id}/activities`)
      const data = await response.json()
      setActivities(data || [])
    } catch (err) {
      setActivities([])
    }
  }

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_URL}/agents`)
      const data = await response.json()
      setAgents(data || [])
    } catch (err) {
      setAgents([])
    }
  }

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`${API_URL}/files/ticket/${ticket.id}`)
      const data = await response.json()
      setAttachments(data || [])
    } catch (err) {
      setAttachments([])
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    await uploadFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    emitTyping(ticket.id, false)

    try {
      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticket.id,
          sender_id: currentUser.id,
          sender_name: currentUser.name,
          sender_role: currentUser.role,
          message: newMessage
        })
      })
      
      if (response.ok) {
        setNewMessage('')
        await fetchMessages()
      }
    } catch (err) {
      alert('Failed to send message')
    }
  }

  const handleTyping = (value) => {
    setNewMessage(value)
    
    if (value.trim()) {
      emitTyping(ticket.id, true)
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        emitTyping(ticket.id, false)
      }, 2000)
    } else {
      emitTyping(ticket.id, false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      await uploadFile(file)
    }
  }

  const uploadFile = async (file) => {
    const validation = validateFileUpload(file, {
      maxFileSize: 10 * 1024 * 1024,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'zip']
    })

    if (!validation.valid) {
      alert(validation.errors.join('\n'))
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('ticket_id', ticket.id)
    formData.append('uploaded_by', currentUser.id)

    try {
      const response = await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Upload failed')
      }
      
      fetchAttachments()
    } catch (err) {
      alert('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveChanges = async () => {
    try {
      await fetch(`${API_URL}/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editedTicket,
          performed_by: currentUser.id,
          performed_by_name: currentUser.name
        })
      })
      setIsEditing(false)
      onUpdate()
      fetchActivities()
    } catch (err) {
      alert('Failed to update ticket')
    }
  }

  const timeline = [...messages, ...activities]
    .sort((a, b) => new Date(a.timestamp || a.created_at) - new Date(b.timestamp || b.created_at))

  const canEdit = currentUser.role !== 'Normal User' || (currentUser.role === 'Normal User' && ticket.created_by === currentUser.id && ticket.status !== 'Closed')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{ticket.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{ticket.id}</p>
            </div>
            <div className="flex items-center gap-2">
              {ticket.sla_violated && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  SLA Violated
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                ticket.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                ticket.status === 'Open' ? 'bg-green-100 text-green-800' :
                ticket.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {ticket.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                ticket.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                ticket.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {ticket.priority}
              </span>
              {canEdit && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 border-b">
          <p className="text-gray-700 mb-4">{ticket.description}</p>
          
          {attachments.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments ({attachments.length})</h4>
              <div className="grid grid-cols-2 gap-2">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                    <span className="text-lg">{getFileIcon(att.filename)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{att.filename}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(att.file_size || 0)}</p>
                    </div>
                    <a
                      href={`http://localhost:5002${att.download_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      Download
                    </a>
                    {att.filename.match(/\.(jpg|jpeg|png|gif)$/i) && (
                      <button
                        onClick={() => window.open(`http://localhost:5002${att.download_url}`, '_blank')}
                        className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                      >
                        Preview
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Agent</label>
              {isEditing ? (
                <select
                  value={editedTicket.assigned_to || ''}
                  onChange={(e) => setEditedTicket({...editedTicket, assigned_to: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Unassigned</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-900">{ticket.assigned_to ? `Agent ${ticket.assigned_to}` : 'Unassigned'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
              <p className="text-gray-900">{new Date(ticket.created_at).toLocaleString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              {isEditing ? (
                <select
                  value={editedTicket.status}
                  onChange={(e) => setEditedTicket({...editedTicket, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="New">New</option>
                  <option value="Open">Open</option>
                  <option value="Pending">Pending</option>
                  <option value="Closed">Closed</option>
                </select>
              ) : (
                <p className="text-gray-900">{ticket.status}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              {isEditing ? (
                <select
                  value={editedTicket.priority}
                  onChange={(e) => setEditedTicket({...editedTicket, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              ) : (
                <p className="text-gray-900">{ticket.priority}</p>
              )}
            </div>
          </div>
          {isEditing && (
            <button
              onClick={handleSaveChanges}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Save Changes
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50" ref={scrollRef}>
          <h3 className="text-lg font-semibold mb-4">Timeline</h3>
          <div className="space-y-4">
            {timeline.map((item, index) => (
              <div key={item.id || index} className={`flex gap-3 ${item.type === 'message' || item.message ? 'items-start' : 'items-center'}`}>
                {item.type === 'message' || item.message ? (
                  <>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      item.sender_role === 'Normal User' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {item.sender_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-medium text-gray-900">{item.sender_name}</span>
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                              item.sender_role === 'Normal User' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {item.sender_role}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{item.message}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 text-xs">⚙</span>
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-lg p-3">
                      <p className="text-sm text-gray-700">{item.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        by {item.performed_by_name} • {new Date(item.timestamp || item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t bg-white">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            {typingUsers.size > 0 && (
              <span className="text-xs text-blue-600">
                {Array.from(typingUsers.values()).join(', ')} typing...
              </span>
            )}
          </div>
          <div 
            className={`${isDragging ? 'border-blue-500 bg-blue-50' : ''} border-2 border-dashed border-gray-300 rounded-lg p-4`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <textarea
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
                placeholder="Type your message or drag files here..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="3"
              />
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm disabled:opacity-50"
                >
                  {uploading ? '⏳' : '📎'} Attach
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
