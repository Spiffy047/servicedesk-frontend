import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import TicketDetailDialog from '../tickets/TicketDetailDialog'
import DataModal from '../common/DataModal'

const API_URL = 'http://localhost:5002/api'

/**
 * NormalUserDashboard - Main interface for end users to manage their support tickets
 * 
 * Features:
 * - View personal ticket statistics (total, open, pending, SLA violations)
 * - Create new support tickets with priority and category selection
 * - Browse and search through personal ticket history
 * - View detailed ticket information and conversation history
 * - Track ticket status and resolution progress
 * - Auto-assignment notification for new tickets
 * 
 * User permissions:
 * - Can only see their own tickets
 * - Can create new tickets
 * - Can view and comment on their tickets
 * - Cannot edit ticket properties (status, priority, assignment)
 */
export default function NormalUserDashboard({ user }) {
  // Main data state - user's tickets and loading status
  const [tickets, setTickets] = useState([]) // All tickets belonging to this user
  const [loading, setLoading] = useState(true) // Initial page load state
  
  // UI state for modals and dialogs
  const [showCreateModal, setShowCreateModal] = useState(false) // New ticket form modal
  const [selectedTicket, setSelectedTicket] = useState(null) // Ticket detail dialog
  const [modalData, setModalData] = useState(null) // Data modal for statistics
  
  // Error handling and form states
  const [error, setError] = useState(null) // General error messages
  const [createError, setCreateError] = useState(null) // Ticket creation errors
  const [creating, setCreating] = useState(false) // Form submission state
  const [successMessage, setSuccessMessage] = useState('') // Success feedback

  // Load user's tickets when component mounts or user changes
  useEffect(() => {
    fetchTickets()
  }, [user])

  // Fetch all tickets belonging to the current user
  const fetchTickets = async () => {
    try {
      setLoading(true)
      // API filters tickets by user_id to ensure users only see their own tickets
      const response = await fetch(`${API_URL}/tickets?user_id=${user.id}`)
      const data = await response.json()
      setTickets(data)
    } catch (error) {
      setError('Failed to load tickets')
      console.error('Failed to fetch tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle new ticket creation form submission
  const handleCreateTicket = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    setCreating(true)
    setCreateError(null)
    
    try {
      // Submit new ticket with user's ID and form data
      const response = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title'),
          description: formData.get('description'),
          priority: formData.get('priority'),
          category: formData.get('category'),
          user_id: user.id // Associate ticket with current user
        })
      })

      if (response.ok) {
        // Success - close modal, refresh tickets, show confirmation
        setSuccessMessage('Ticket created successfully!')
        setShowCreateModal(false)
        fetchTickets() // Refresh ticket list to show new ticket
        e.target.reset() // Clear form fields
        setTimeout(() => setSuccessMessage(''), 3000) // Auto-hide success message
      }
    } catch (error) {
      setCreateError('Failed to create ticket. Please try again.')
      console.error('Failed to create ticket:', error)
    } finally {
      setCreating(false)
    }
  }

  // Show loading skeleton while fetching tickets
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">
          {/* Skeleton for page title */}
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          {/* Skeleton for statistics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header with welcome message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.name}</h1>
          <p className="text-gray-600 mt-2">Manage your support tickets and track their progress</p>
        </div>

        {/* Statistics cards - clickable to show detailed data */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total tickets card */}
          <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setModalData({ title: 'All My Tickets', data: tickets })}>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Total Tickets</div>
              <div className="text-blue-600">🎫</div>
            </div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{tickets.length}</div>
          </div>
          {/* Open tickets card */}
          <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setModalData({ title: 'Open Tickets', data: tickets.filter(t => t.status === 'Open') })}>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Open</div>
              <div className="text-green-600">🟢</div>
            </div>
            <div className="text-3xl font-bold text-green-600">
              {tickets.filter(t => t.status === 'Open').length}
            </div>
          </div>
          {/* Pending tickets card */}
          <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setModalData({ title: 'Pending Tickets', data: tickets.filter(t => t.status === 'Pending') })}>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-yellow-600">🔄</div>
            </div>
            <div className="text-3xl font-bold text-yellow-600">
              {tickets.filter(t => t.status === 'Pending').length}
            </div>
          </div>
          {/* SLA violated tickets card */}
          <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setModalData({ title: 'Past SLA Tickets', data: tickets.filter(t => t.sla_violated) })}>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Past SLA</div>
              <div className="text-red-600">⚠️</div>
            </div>
            <div className="text-3xl font-bold text-red-600">
              {tickets.filter(t => t.sla_violated).length}
            </div>
          </div>
        </div>

        {/* Tickets section header with create button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">My Tickets</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            New Ticket
          </button>
        </div>

        {/* Tickets list or empty state */}
        <div className="grid gap-4">
          {tickets.length === 0 ? (
            /* Empty state when user has no tickets */
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <p className="mb-4">You haven't created any tickets yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Your First Ticket
              </button>
            </div>
          ) : (
            /* Render each ticket as a card */
            tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                {/* Ticket header with title and status badges */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{ticket.id}</p>
                  </div>
                  {/* Status and priority badges */}
                  <div className="flex gap-2">
                    {/* Status badge with color coding */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      ticket.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                      ticket.status === 'Open' ? 'bg-green-100 text-green-800' :
                      ticket.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {ticket.status}
                    </span>
                    {/* Priority badge with color coding */}
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
                {/* Ticket description */}
                <p className="text-gray-700 mb-3">{ticket.description}</p>
                
                {/* Ticket metadata and actions */}
                <div className="flex justify-between items-center">
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>Category: {ticket.category}</span>
                    <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                    {ticket.assigned_to && <span>Assigned to: Agent {ticket.assigned_to}</span>}
                  </div>
                  {/* View details button opens ticket dialog */}
                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    View Details
                  </button>
                </div>
                
                {/* Resolution info for closed tickets */}
                {ticket.status === 'Closed' && ticket.resolved_at && (
                  <div className="mt-3 pt-3 border-t text-sm text-green-600">
                    ✓ Resolved on {new Date(ticket.resolved_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Create ticket modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Ticket</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Ticket creation form */}
              <form onSubmit={handleCreateTicket} className="space-y-4">
                {/* Error message display */}
                {createError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
                    {createError}
                  </div>
                )}
                {/* Title field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of the issue"
                  />
                </div>

                {/* Description field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    required
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Detailed description of the issue"
                  />
                </div>

                {/* Priority and category selection */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Priority dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="priority"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  {/* Category dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Hardware">Hardware</option>
                      <option value="Software">Software</option>
                      <option value="Network">Network</option>
                      <option value="Access">Access</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Auto-assignment info box */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800">
                  <p className="font-medium">Auto-Assignment Enabled</p>
                  <p className="mt-1">This ticket will be automatically assigned to the agent with the least workload.</p>
                </div>

                {/* Form action buttons */}
                <div className="flex gap-3 pt-4">
                  {/* Submit button with loading state */}
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating...' : 'Create Ticket'}
                  </button>
                  {/* Cancel button */}
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Ticket detail dialog - opens when user clicks "View Details" */}
      {selectedTicket && (
        <TicketDetailDialog
          ticket={selectedTicket}
          currentUser={user}
          onClose={() => setSelectedTicket(null)}
          onUpdate={fetchTickets} // Refresh tickets if changes are made
        />
      )}

      {/* Data modal for showing filtered ticket lists from statistics cards */}
      {modalData && <DataModal title={modalData.title} data={modalData.data} onClose={() => setModalData(null)} />}
    </div>
  )
}

NormalUserDashboard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired
  }).isRequired
}