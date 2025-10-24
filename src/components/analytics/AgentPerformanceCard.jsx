import { useEffect, useState, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'

const API_URL = 'http://localhost:5002/api'

export default function AgentPerformanceCard({ agentId, onCardClick, tickets }) {
  const [performance, setPerformance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPerformance = useCallback(() => {
    if (!agentId) return
    
    setLoading(true)
    setError(null)
    fetch(`${API_URL}/analytics/agent-performance-detailed`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch performance data')
        return res.json()
      })
      .then(data => {
        const agentData = data.find(a => a.agent_id === agentId)
        if (!agentData) {
          throw new Error('Agent performance data not found')
        }
        // Validate required fields
        const requiredFields = ['active_tickets', 'closed_tickets', 'avg_handle_time', 'sla_violations', 'performance_rating', 'performance_score']
        const missingFields = requiredFields.filter(field => agentData[field] === undefined || agentData[field] === null)
        if (missingFields.length > 0) {
          console.warn('Missing performance data fields:', missingFields)
        }
        setPerformance(agentData)
      })
      .catch(err => {
        setError(err.message)
        console.error(err)
      })
      .finally(() => setLoading(false))
  }, [agentId])

  useEffect(() => {
    fetchPerformance()
  }, [fetchPerformance])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-600 text-sm">{error}</p>
          <button 
            onClick={fetchPerformance} 
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!performance) return null

  const ratingColor = useMemo(() => {
    const rating = performance?.performance_rating
    return rating === 'Excellent' ? 'text-green-600 bg-green-50' :
           rating === 'Good' ? 'text-blue-600 bg-blue-50' :
           rating === 'Average' ? 'text-yellow-600 bg-yellow-50' :
           'text-red-600 bg-red-50'
  }, [performance?.performance_rating])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">My Performance</h3>
        <button 
          onClick={fetchPerformance}
          disabled={loading}
          className="text-gray-500 hover:text-gray-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          title="Refresh data"
          onKeyDown={(e) => e.key === 'Enter' && !loading && fetchPerformance()}
        >
          🔄
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <button 
          className="text-center p-3 bg-blue-50 rounded cursor-pointer hover:shadow-md transition-shadow w-full focus:outline-none focus:ring-2 focus:ring-blue-500" 
          onClick={() => onCardClick?.({ title: 'My Active Tickets', data: tickets?.filter(t => t.assigned_to === agentId && t.status !== 'Closed') || [] })}
          onKeyDown={(e) => e.key === 'Enter' && onCardClick?.({ title: 'My Active Tickets', data: tickets?.filter(t => t.assigned_to === agentId && t.status !== 'Closed') || [] })}
          aria-label="View active tickets"
        >
          <div className="text-2xl font-bold text-blue-600">{performance.active_tickets ?? 0}</div>
          <div className="text-xs text-gray-600">Active Tickets</div>
        </button>
        <button 
          className="text-center p-3 bg-green-50 rounded cursor-pointer hover:shadow-md transition-shadow w-full focus:outline-none focus:ring-2 focus:ring-green-500" 
          onClick={() => onCardClick?.({ title: 'My Closed Tickets', data: tickets?.filter(t => t.assigned_to === agentId && t.status === 'Closed') || [] })}
          onKeyDown={(e) => e.key === 'Enter' && onCardClick?.({ title: 'My Closed Tickets', data: tickets?.filter(t => t.assigned_to === agentId && t.status === 'Closed') || [] })}
          aria-label="View closed tickets"
        >
          <div className="text-2xl font-bold text-green-600">{performance.closed_tickets ?? 0}</div>
          <div className="text-xs text-gray-600">Closed Tickets</div>
        </button>
        <div className="text-center p-3 bg-purple-50 rounded">
          <div className="text-2xl font-bold text-purple-600">{performance.avg_handle_time ?? 0}h</div>
          <div className="text-xs text-gray-600">Avg Handle Time</div>
        </div>
        <button 
          className="text-center p-3 bg-red-50 rounded cursor-pointer hover:shadow-md transition-shadow w-full focus:outline-none focus:ring-2 focus:ring-red-500" 
          onClick={() => onCardClick?.({ title: 'My SLA Violations', data: tickets?.filter(t => t.assigned_to === agentId && t.sla_violated) || [] })}
          onKeyDown={(e) => e.key === 'Enter' && onCardClick?.({ title: 'My SLA Violations', data: tickets?.filter(t => t.assigned_to === agentId && t.sla_violated) || [] })}
          aria-label="View SLA violations"
        >
          <div className="text-2xl font-bold text-red-600">{performance.sla_violations ?? 0}</div>
          <div className="text-xs text-gray-600">SLA Violations</div>
        </button>
      </div>

      <div className={`p-4 rounded-lg ${ratingColor}`}>
        <div className="text-center">
          <div className="text-sm font-medium mb-1">Performance Rating</div>
          <div className="text-2xl font-bold">{performance.performance_rating ?? 'N/A'}</div>
          <div className="text-sm mt-1">Score: {performance.performance_score ?? 0}</div>
        </div>
      </div>
    </div>
  )
}

AgentPerformanceCard.propTypes = {
  agentId: PropTypes.number.isRequired,
  onCardClick: PropTypes.func,
  tickets: PropTypes.arrayOf(PropTypes.shape({
    assigned_to: PropTypes.number,
    status: PropTypes.string,
    sla_violated: PropTypes.bool
  }))
}