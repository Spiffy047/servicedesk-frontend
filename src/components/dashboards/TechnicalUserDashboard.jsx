import { useState, useEffect } from 'react'
import TicketDetailDialog from '../tickets/TicketDetailDialog'
import { getAvailableStatuses, getEscalationRules, validateWorkflow, shouldAutoAssign, getStatusColor, getPriorityColor } from '../../utils/ticketUtils'

const API_URL = 'http://localhost:5002/api'

export default function TechnicalUserDashboard({ user, onLogout }) {
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('assigned')

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${API_URL}/tickets`)
      const data = await response.json()
      setTickets(data || [])
    } catch (err) {
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  const assignedTickets = tickets.filter(t => t.assigned_to === user.id)
  const unassignedTickets = tickets.filter(t => !t.assigned_to && t.status !== 'Closed')

  const handleTakeTicket = async (ticketId) => {
    try {
      await fetch(`${API_URL}/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_to: user.id,
          status: 'Open',
          performed_by: user.id,
          performed_by_name: user.name
        })
      })
      fetchTickets()
    } catch (err) {
      alert('Failed to assign ticket')
    }
  }

  const handleStatusChange = async (ticketId, newStatus) => {
    const ticket = tickets.find(t => t.id === ticketId)
    const validation = validateWorkflow(ticket, newStatus, user.role)
    
    if (!validation.isValid) {
      alert(validation.errors.join('\n'))
      return
    }

    try {
      await fetch(`${API_URL}/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          performed_by: user.id,
          performed_by_name: user.name
        })
      })
      fetchTickets()
    } catch (err) {
      alert('Failed to update status')
    }
  }

  const getTicketAlerts = (ticket) => {
    const rules = getEscalationRules(ticket)
    return rules.map(rule => (
      <div key={rule.type} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
        ⚠️ {rule.reason}
      </div>
    ))
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Technical Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user.name}</p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('assigned')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assigned'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Tickets ({assignedTickets.length})
            </button>
            <button
              onClick={() => setActiveTab('unassigned')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'unassigned'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Available Tickets ({unassignedTickets.length})
            </button>
          </nav>
        </div>

        {activeTab === 'assigned' && (
          <div className="space-y-4">
            {assignedTickets.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                No assigned tickets
              </div>
            ) : (
              assignedTickets.map((ticket) => (
                <div key={ticket.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
                      <p className="text-sm text-gray-600">{ticket.id}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <select
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${getStatusColor(ticket.status)}`}
                      >
                        <option value={ticket.status}>{ticket.status}</option>
                        {getAvailableStatuses(ticket.status).map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{ticket.description}</p>
                  <div className="space-y-1 mb-3">
                    {getTicketAlerts(ticket)}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Created: {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'unassigned' && (
          <div className="space-y-4">
            {unassignedTickets.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                No unassigned tickets
              </div>
            ) : (
              unassignedTickets.map((ticket) => (
                <div key={ticket.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
                      <p className="text-sm text-gray-600">{ticket.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        ticket.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                        ticket.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                        ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{ticket.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Created: {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleTakeTicket(ticket.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Take Ticket
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {selectedTicket && (
        <TicketDetailDialog
          ticket={selectedTicket}
          currentUser={user}
          onClose={() => setSelectedTicket(null)}
          onUpdate={fetchTickets}
        />
      )}
    </div>
  )
}