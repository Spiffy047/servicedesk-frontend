import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import AgentPerformanceCard from '../analytics/AgentPerformanceCard'
import TicketDetailDialog from '../tickets/TicketDetailDialog'
import DataModal from '../common/DataModal'

const API_URL = 'http://localhost:5002/api'

/**
 * TechnicalUserDashboard - Dashboard for technical users/agents to manage their assigned tickets
 * @param {Object} props - Component props
 * @param {Object} props.user - User object with id, name, and role
 * @param {Function} props.onLogout - Logout callback function
 * @returns {JSX.Element} The rendered technical user dashboard component
 */
export default function TechnicalUserDashboard({ user, onLogout }) {
  const [tickets, setTickets] = useState([])
  const [activeTab, setActiveTab] = useState('myQueue')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [modalData, setModalData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTickets()
  }, [user])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/tickets`)
      const data = await response.json()
      setTickets(data)
    } catch (error) {
      setError('Failed to load tickets')
      console.error('Failed to fetch tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        fetchTickets()
      }
    } catch (error) {
      console.error('Failed to update ticket status:', error)
    }
  }

  const myTickets = tickets.filter(t => t.assigned_to === user.id)
  const slaViolationTickets = myTickets.filter(t => t.sla_violated && t.status !== 'Closed')
  const displayTickets = activeTab === 'myQueue' ? myTickets : tickets

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">IT ServiceDesk - Agent Portal</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-600">Welcome, </span>
                <span className="font-medium">{user.name}</span>
                <span className="text-gray-500 ml-2">({user.role})</span>
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Search tickets by ID, title, or description..."
            onChange={(e) => {
              const search = e.target.value.toLowerCase()
              if (!search) {
                fetchTickets()
                return
              }
              const filtered = tickets.filter(t => 
                t.id.toLowerCase().includes(search) ||
                t.title.toLowerCase().includes(search) ||
                t.description.toLowerCase().includes(search)
              )
              setTickets(filtered)
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="mb-6">
          <AgentPerformanceCard agentId={user.id} onCardClick={setModalData} tickets={tickets} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setModalData({ title: 'My Assigned Tickets', data: myTickets })}>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Assigned Tickets</div>
              <div className="text-blue-600">💼</div>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {myTickets.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setModalData({ title: 'All Tickets', data: tickets })}>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Total Tickets</div>
              <div className="text-gray-600">🎫</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {tickets.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setModalData({ title: 'SLA Breached Tickets', data: tickets.filter(t => t.sla_violated) })}>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">SLA Breached</div>
              <div className="text-red-600">⚠️</div>
            </div>
            <div className="text-3xl font-bold text-red-600">
              {tickets.filter(t => t.sla_violated).length}
            </div>
          </div>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div className="border-b border-gray-200">
            <nav className="flex gap-4">
              <button
                onClick={() => setActiveTab('myQueue')}
                className={`px-4 py-2 font-medium ${activeTab === 'myQueue' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                My Queue ({myTickets.length})
              </button>
              <button
                onClick={() => setActiveTab('allTickets')}
                className={`px-4 py-2 font-medium ${activeTab === 'allTickets' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                All Tickets ({tickets.length})
              </button>
            </nav>
          </div>
        </div>

        {slaViolationTickets.length > 0 && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="animate-pulse text-red-600 text-xl">⚠️</span>
              <h3 className="font-semibold text-red-900">SLA Violation Alert</h3>
            </div>
            <div className="space-y-2">
              {slaViolationTickets.map(ticket => (
                <div key={ticket.id} className="flex justify-between items-center bg-white p-3 rounded">
                  <div>
                    <span className="font-medium">{ticket.id}</span>
                    <span className="text-gray-600 ml-2">{ticket.title}</span>
                  </div>
                  <button
                    onClick={() => handleStatusUpdate(ticket.id, 'In Progress')}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Take Action
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {displayTickets.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No tickets found
            </div>
          ) : (
            displayTickets
              .sort((a, b) => {
                const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 }
                return priorityOrder[b.priority] - priorityOrder[a.priority]
              })
              .map((ticket) => (
                <div key={ticket.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{ticket.id}</p>
                    </div>
                    <div className="flex gap-2">
                      {ticket.sla_violated && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
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
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{ticket.description}</p>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-3">
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>Category: {ticket.category}</span>
                      <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        View Details
                      </button>
                      {ticket.status !== 'Closed' && ticket.assigned_to === user.id && (
                        <>
                          {ticket.status !== 'Pending' && (
                            <button
                              onClick={() => handleStatusUpdate(ticket.id, 'Pending')}
                              className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm hover:bg-yellow-200"
                            >
                              Set Pending
                            </button>
                          )}
                          <button
                            onClick={() => handleStatusUpdate(ticket.id, 'Closed')}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Resolve
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </main>

      {selectedTicket && (
        <TicketDetailDialog
          ticket={selectedTicket}
          currentUser={user}
          onClose={() => setSelectedTicket(null)}
          onUpdate={fetchTickets}
        />
      )}

      {modalData && <DataModal title={modalData.title} data={modalData.data} onClose={() => setModalData(null)} />}
    </div>
  )
}

TechnicalUserDashboard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired
  }).isRequired,
  onLogout: PropTypes.func.isRequired
}