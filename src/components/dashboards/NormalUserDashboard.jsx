import { useState, useEffect } from 'react'
import CreateTicketForm from '../tickets/CreateTicketForm'
import TicketDetailDialog from '../tickets/TicketDetailDialog'

const API_URL = 'http://localhost:5002/api'

export default function NormalUserDashboard({ user, onLogout }) {
  const [tickets, setTickets] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${API_URL}/tickets?created_by=${user.id}`)
      const data = await response.json()
      setTickets(data || [])
    } catch (err) {
      console.error('Failed to fetch tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTicketCreated = (newTicket) => {
    setTickets(prev => [newTicket, ...prev])
    setShowCreateForm(false)
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
              <h1 className="text-2xl font-bold text-gray-900">My Service Requests</h1>
              <p className="text-sm text-gray-600">Welcome back, {user.name}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                New Request
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-blue-600">{tickets.length}</div>
              <div className="text-sm text-gray-600">Total Requests</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-green-600">
                {tickets.filter(t => t.status === 'Open').length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-yellow-600">
                {tickets.filter(t => t.status === 'Pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-gray-600">
                {tickets.filter(t => t.status === 'Closed').length}
              </div>
              <div className="text-sm text-gray-600">Resolved</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-500 mb-4">No service requests yet</div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Create Your First Request
              </button>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
                    <p className="text-sm text-gray-600">{ticket.id}</p>
                  </div>
                  <div className="flex gap-2">
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
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                    {ticket.assigned_to && <span className="ml-4">Assigned to: Agent {ticket.assigned_to}</span>}
                  </div>
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
      </main>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <CreateTicketForm
            onClose={() => setShowCreateForm(false)}
            onSuccess={handleTicketCreated}
          />
        </div>
      )}

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