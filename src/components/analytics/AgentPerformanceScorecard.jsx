import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:5002/api'

export default function AgentPerformanceScorecard() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/analytics/agent-performance-detailed`)
      .then(res => res.json())
      .then(setAgents)
      .catch(console.error)
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Agent Performance Scorecard</h3>
      <div className="space-y-4">
        {agents.map(agent => (
          <div key={agent.agent_id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{agent.name}</h4>
                <p className="text-sm text-gray-600">{agent.email}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRatingColor(agent.performance_rating)}`}>
                {agent.performance_rating}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Active</div>
                <div className="font-semibold text-lg">{agent.active_tickets}</div>
              </div>
              <div>
                <div className="text-gray-600">Closed</div>
                <div className="font-semibold text-lg">{agent.closed_tickets}</div>
              </div>
              <div>
                <div className="text-gray-600">Avg Time</div>
                <div className="font-semibold text-lg">{agent.avg_handle_time.toFixed(1)}h</div>
              </div>
              <div>
                <div className="text-gray-600">Violations</div>
                <div className="font-semibold text-lg text-red-600">{agent.sla_violations}</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t">
              <div className="text-sm text-gray-600">Performance Score: <span className="font-semibold text-gray-900">{agent.performance_score}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}