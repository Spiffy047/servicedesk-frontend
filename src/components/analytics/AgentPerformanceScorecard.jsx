import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:5002/api'

export default function AgentPerformanceScorecard() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('performance_score')
  const [sortOrder, setSortOrder] = useState('desc')

  useEffect(() => {
    fetch(`${API_URL}/analytics/agent-performance-detailed`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch agent data')
        return res.json()
      })
      .then(setAgents)
      .catch(err => {
        setError(err.message)
        console.error(err)
      })
      .finally(() => setLoading(false))
  }, [])

  const getRatingColor = (rating) => {
    switch(rating) {
      case 'Excellent': return 'bg-green-100 text-green-800'
      case 'Good': return 'bg-blue-100 text-blue-800'
      case 'Average': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-red-100 text-red-800'
    }
  }

  const sortedAgents = [...agents].sort((a, b) => {
    const aVal = a[sortBy] ?? 0
    const bVal = b[sortBy] ?? 0
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
  })

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Agent Performance Scorecard</h3>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Agent Performance Scorecard</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-8 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Agent Performance Scorecard</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">📄</div>
          <p className="text-gray-600">No agent performance data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Agent Performance Scorecard</h3>
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm border rounded px-2 py-1"
        >
          <option value="performance_score">Score</option>
          <option value="closed_tickets">Closed Tickets</option>
          <option value="active_tickets">Active Tickets</option>
          <option value="avg_handle_time">Handle Time</option>
        </select>
      </div>
      <div className="space-y-4">
        {sortedAgents.map(agent => (
          <div key={agent.agent_id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{agent.name || 'Unknown Agent'}</h4>
                <p className="text-sm text-gray-600">{agent.email || 'No email'}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRatingColor(agent.performance_rating)}`}>
                {agent.performance_rating || 'N/A'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Active</div>
                <div className="font-semibold text-lg">{agent.active_tickets ?? 0}</div>
              </div>
              <div>
                <div className="text-gray-600">Closed</div>
                <div className="font-semibold text-lg">{agent.closed_tickets ?? 0}</div>
              </div>
              <div>
                <div className="text-gray-600">Avg Time</div>
                <div className="font-semibold text-lg">{(agent.avg_handle_time ?? 0).toFixed(1)}h</div>
              </div>
              <div>
                <div className="text-gray-600">Violations</div>
                <div className="font-semibold text-lg text-red-600">{agent.sla_violations ?? 0}</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t">
              <div className="text-sm text-gray-600">Performance Score: <span className="font-semibold text-gray-900">{agent.performance_score ?? 0}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}