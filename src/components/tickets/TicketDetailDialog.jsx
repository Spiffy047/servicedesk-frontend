import { useState, useEffect, useRef } from 'react'

const API_URL = 'http://localhost:5002/api'

/**
 * TicketDetailDialog - Full-featured modal for ticket management
 * 
 * This component handles:
 * - Displaying ticket info with real-time status/priority badges
 * - Role-based editing (agents can edit any ticket, users only their own open tickets)
 * - Combined timeline of messages and system activities
 * - File attachments with drag-drop upload
 * - Real-time messaging with keyboard shortcuts (Enter to send, Shift+Enter for newline)
 * - Auto-scroll to keep latest messages visible
 */
export default function TicketDetailDialog({ ticket, onClose, currentUser, onUpdate }) {
  // Timeline data - messages are chat conversations, activities are system events
  const [messages, setMessages] = useState([]) // User/agent chat messages
  const [activities, setActivities] = useState([]) // Status changes, assignments, etc.
  
  // Message composition state
  const [newMessage, setNewMessage] = useState('') // Text being typed in message box
  
  // Ticket editing state - only shown when user has edit permissions
  const [isEditing, setIsEditing] = useState(false) // Toggle between view/edit mode
  const [editedTicket, setEditedTicket] = useState(ticket) // Local copy for editing before save
  
  // Supporting data for dropdowns and file handling
  const [agents, setAgents] = useState([]) // List of agents for assignment dropdown
  const [attachments, setAttachments] = useState([]) // Files attached to this ticket
  const [uploading, setUploading] = useState(false) // Show spinner during file upload
  
  // DOM references for programmatic control
  const scrollRef = useRef(null) // Timeline container - used for auto-scroll to bottom
  const fileInputRef = useRef(null) // Hidden file input - triggered by attach button

  // Load all ticket data when dialog opens or ticket changes
  useEffect(() => {
    fetchMessages() // Get chat history
    fetchActivities() // Get system activity log
    fetchAgents() // Get agent list for assignment dropdown
    fetchAttachments() // Get uploaded files
  }, [ticket.id])

  // Auto-scroll timeline to bottom when new messages/activities arrive
  // This keeps the conversation flowing naturally like a chat app
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, activities])

  // Get all chat messages for this ticket from the API
  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/messages/ticket/${ticket.id}/timeline`)
      const data = await response.json()
      // Handle different response formats from backend
      setMessages(Array.isArray(data) ? data : data.messages || [])
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    }
  }

  // Get system activity log (status changes, assignments, etc.)
  const fetchActivities = async () => {
    try {
      const response = await fetch(`${API_URL}/tickets/${ticket.id}/activities`)
      const data = await response.json()
      setActivities(data || [])
    } catch (err) {
      console.error('Failed to fetch activities:', err)
    }
  }

  // Get list of all agents for the assignment dropdown
  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_URL}/agents`)
      const data = await response.json()
      setAgents(data || [])
    } catch (err) {
      console.error('Failed to fetch agents:', err)
    }
  }

  // Get all files attached to this ticket
  const fetchAttachments = async () => {
    try {
      const response = await fetch(`${API_URL}/files/ticket/${ticket.id}`)
      const data = await response.json()
      setAttachments(data || [])
    } catch (err) {
      console.error('Failed to fetch attachments:', err)
    }
  }

  // Handle file attachment upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true) // Show loading state on attach button
    
    // Create form data for multipart upload
    const formData = new FormData()
    formData.append('file', file)
    formData.append('ticket_id', ticket.id)
    formData.append('uploaded_by', currentUser.id)

    try {
      await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        body: formData
      })
      fetchAttachments() // Refresh attachment list to show new file
    } catch (err) {
      console.error('Failed to upload file:', err)
    } finally {
      setUploading(false)
      // Clear the file input so same file can be uploaded again if needed
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Send a new message in the ticket conversation
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return // Don't send empty messages

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
        setNewMessage('') // Clear input field
        await fetchMessages() // Refresh to show new message in timeline
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  // Save changes made to ticket properties (status, priority, assignment)
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
      setIsEditing(false) // Exit edit mode
      onUpdate() // Tell parent component to refresh ticket list
      fetchActivities() // Refresh to show the update activity in timeline
    } catch (err) {
      console.error('Failed to update ticket:', err)
    }
  }

  // Combine messages and activities into a single chronological timeline
  // Messages have 'timestamp', activities have 'created_at' - we handle both
  const timeline = [...messages, ...activities]
    .sort((a, b) => new Date(a.timestamp || a.created_at) - new Date(b.timestamp || b.created_at))

  // Determine if current user can edit this ticket
  // Rules: Agents can edit any ticket, regular users can only edit their own tickets that aren't closed
  const canEdit = currentUser.role !== 'Normal User' || 
    (currentUser.role === 'Normal User' && ticket.created_by === currentUser.id && ticket.status !== 'Closed')

  return (
    // Full-screen modal overlay with backdrop
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {/* Main dialog container - flexbox layout for header/content/footer */}
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header: ticket title, ID, and status badges */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{ticket.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{ticket.id}</p>
            </div>
            {/* Right side: status badges and action buttons */}
            <div className="flex items-center gap-2">
              {/* SLA violation warning - only shown if ticket has breached SLA */}
              {ticket.sla_violated && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  SLA Violated
                </span>
              )}
              {/* Status badge with color coding based on status */}
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                ticket.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                ticket.status === 'Open' ? 'bg-green-100 text-green-800' :
                ticket.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {ticket.status}
              </span>
              {/* Priority badge with color coding - Critical=red, High=orange, etc. */}
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                ticket.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                ticket.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {ticket.priority}
              </span>
              {/* Edit button - only shown if user has permission to edit this ticket */}
              {canEdit && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              )}
              {/* Close dialog button */}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Ticket details: description, attachments, and editable fields */}
        <div className="p-6 border-b">
          <p className="text-gray-700 mb-4">{ticket.description}</p>
          
          {/* File attachments section - only shown if there are files */}
          {attachments.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments ({attachments.length})</h4>
              <div className="flex flex-wrap gap-2">
                {/* Each attachment is a clickable download link */}
                {attachments.map(att => (
                  <a
                    key={att.id}
                    href={`http://localhost:5002${att.download_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm flex items-center gap-2"
                  >
                    📎 {att.filename} ({att.file_size_mb}MB)
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {/* Ticket metadata in 2x2 grid layout */}
          <div className="grid grid-cols-2 gap-4">
            {/* Agent assignment - dropdown in edit mode, text in view mode */}
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
            {/* Creation date - always read-only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
              <p className="text-gray-900">{new Date(ticket.created_at).toLocaleString()}</p>
            </div>
            {/* Status field - dropdown in edit mode */}
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
            {/* Priority field - dropdown in edit mode */}
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
          {/* Save button - only visible when in edit mode */}
          {isEditing && (
            <button
              onClick={handleSaveChanges}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Save Changes
            </button>
          )}
        </div>

        {/* Timeline section - scrollable area showing chronological messages and activities */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50" ref={scrollRef}>
          <h3 className="text-lg font-semibold mb-4">Timeline</h3>
          <div className="space-y-4">
            {/* Render each timeline item - could be a message or system activity */}
            {timeline.map((item, index) => (
              <div key={item.id || index} className={`flex gap-3 ${item.type === 'message' || item.message ? 'items-start' : 'items-center'}`}>
                {/* Check if this is a chat message (has message property) */}
                {item.type === 'message' || item.message ? (
                  {/* Message layout: avatar + message bubble */}
                  <>
                    {/* User avatar - blue for customers, green for agents */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      item.sender_role === 'Normal User' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {item.sender_name.charAt(0)}
                    </div>
                    {/* Message content in chat bubble style */}
                    <div className="flex-1">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-medium text-gray-900">{item.sender_name}</span>
                            {/* Role badge with matching colors */}
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
                  {/* System activity layout: gear icon + description */}
                  <>
                    {/* System activity icon */}
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 text-xs">⚙</span>
                    </div>
                    {/* Activity description with performer and timestamp */}
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

        {/* Message composition area at bottom */}
        <div className="p-6 border-t bg-white">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            {/* Message textarea with keyboard shortcuts */}
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends message, Shift+Enter adds new line (like Slack/Discord)
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(e)
                }
              }}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="3"
            />
            {/* Action buttons: attach file and send */}
            <div className="flex flex-col gap-2">
              {/* Hidden file input - triggered by attach button */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
              />
              {/* File attachment button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm disabled:opacity-50"
              >
                {uploading ? '⏳' : '📎'} Attach
              </button>
              {/* Send message button */}
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
  )
}
