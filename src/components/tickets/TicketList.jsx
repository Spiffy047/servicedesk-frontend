import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

const API_URL = 'http://localhost:5002/api'

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
}

const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800'
}

/**
 * TicketList displays a list of tickets with filtering and management capabilities
 * @param {Object} props - Component props
 * @param {string} props.userRole - Current user's role for permission checks
 * @returns {JSX.Element} The rendered ticket list component
 */
export default function TicketList({ userRole = 'normal' }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  const fetchTickets = () => {
    setLoading(true)
    setError(null)
    fetch(`${API_URL}/tickets`)
      .then(res => res.json())
      .then(setTickets)
      .catch(err => {
        setError('Failed to load tickets')
        console.error(err)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const updateTicketStatus = (ticketId, newStatus) => {
    fetch(`${API_URL}/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    .then(res => res.json())
    .then(() => {
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      ))
    })
    .catch(err => console.error('Failed to update ticket:', err))
  }

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true
    return ticket.status === filter
  })

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Tickets</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="text-red-500 text-2xl mb-2">⚠️</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchTickets}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Tickets ({filteredTickets.length})</h2>
          <button 
            onClick={fetchTickets}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50 p-2 rounded"
            title="Refresh tickets"
          >
            🔄
          </button>
        </div>
        <div className="mt-4 flex gap-2 flex-wrap">
          {['all', 'open', 'in-progress', 'resolved', 'closed'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-full text-sm capitalize ${
                filter === status 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>
      
      <div className="divide-y">
        {filteredTickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No tickets found
          </div>
        ) : (
          filteredTickets.map(ticket => (
            <div key={ticket.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">#{ticket.id}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      PRIORITY_COLORS[ticket.priority] || 'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      STATUS_COLORS[ticket.status] || 'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.status?.replace('-', ' ')}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{ticket.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                  <div className="text-xs text-gray-500">
                    Created: {new Date(ticket.created_at).toLocaleDateString()} • 
                    Assigned: {ticket.assigned_to || 'Unassigned'}
                  </div>
                </div>
                
                {(userRole === 'technical' || userRole === 'supervisor' || userRole === 'admin') && (
                  <div className="ml-4">
                    <select
                      value={ticket.status}
                      onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

TicketList.propTypes = {
  userRole: PropTypes.oneOf(['normal', 'technical', 'supervisor', 'admin'])
}