import { useEffect, useState, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'

const API_URL = 'http://localhost:5002/api'

// 📈 AGENT PERFORMANCE CARD: Personal dashboard for agents to track their metrics
// 💡 PRESENTATION HINT: "This shows agents their personal KPIs - like a report card"
export default function AgentPerformanceCard({ agentId, onCardClick, tickets }) {
  // 📉 PERFORMANCE METRICS: Agent's personal KPI data
  const [performance, setPerformance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 📥 FETCH PERFORMANCE DATA: Get agent's KPIs from analytics API
  // 💡 PRESENTATION HINT: "System calculates performance automatically based on ticket handling"
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
        // Find this agent's data from all agents
        const agentData = data.find(a => a.agent_id === agentId)
        if (!agentData) {
          throw new Error('Agent performance data not found')
        }
        
        // Validate KPI fields exist
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

  // 🎨 PERFORMANCE RATING COLORS: Visual feedback based on performance level
  // 💡 PRESENTATION HINT: "Green = Excellent, Blue = Good, Yellow = Average, Red = Needs Improvement"
  const ratingColor = useMemo(() => {
    const rating = performance?.performance_rating
    return rating === 'Excellent' ? 'text-green-600 bg-green-50' :
           rating === 'Good' ? 'text-blue-600 bg-blue-50' :
           rating === 'Average' ? 'text-yellow-600 bg-yellow-50' :
           'text-red-600 bg-red-50'
  }, [performance?.performance_rating])

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base sm:text-lg font-semibold">My Performance</h3>
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
      
      {/* 📈 KPI METRICS GRID: Clickable cards show detailed data */}
      {/* 💡 PRESENTATION HINT: "Each card is clickable to see detailed ticket lists" */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* 💼 Active workload */}
        <button 
          className="text-center p-3 bg-blue-50 rounded cursor-pointer hover:shadow-md hover:bg-blue-100 transition-all duration-200 w-full focus:outline-none focus:ring-2 focus:ring-blue-500" 
          onClick={() => onCardClick?.({ title: 'My Active Tickets', data: tickets?.filter(t => t.assigned_to === agentId && t.status !== 'Closed') || [] })}
          aria-label="View active tickets"
        >
          <div className="text-xl sm:text-2xl font-bold text-blue-600">{performance.active_tickets ?? 0}</div>
          <div className="text-xs text-gray-600">Active Tickets</div>
        </button>
        
        {/* ✅ Completed work */}
        <button 
          className="text-center p-3 bg-green-50 rounded cursor-pointer hover:shadow-md hover:bg-green-100 transition-all duration-200 w-full focus:outline-none focus:ring-2 focus:ring-green-500" 
          onClick={() => onCardClick?.({ title: 'My Closed Tickets', data: tickets?.filter(t => t.assigned_to === agentId && t.status === 'Closed') || [] })}
          aria-label="View closed tickets"
        >
          <div className="text-xl sm:text-2xl font-bold text-green-600">{performance.closed_tickets ?? 0}</div>
          <div className="text-xs text-gray-600">Closed Tickets</div>
        </button>
        
        {/* ⏱️ Efficiency metric */}
        <div className="text-center p-3 bg-purple-50 rounded hover:bg-purple-100 transition-colors duration-200">
          <div className="text-xl sm:text-2xl font-bold text-purple-600">{performance.avg_handle_time ?? 0}h</div>
          <div className="text-xs text-gray-600">Avg Handle Time</div>
        </div>
        
        {/* ⚠️ Performance issues */}
        <button 
          className="text-center p-3 bg-red-50 rounded cursor-pointer hover:shadow-md hover:bg-red-100 transition-all duration-200 w-full focus:outline-none focus:ring-2 focus:ring-red-500" 
          onClick={() => onCardClick?.({ title: 'My SLA Violations', data: tickets?.filter(t => t.assigned_to === agentId && t.sla_violated) || [] })}
          aria-label="View SLA violations"
        >
          <div className="text-xl sm:text-2xl font-bold text-red-600">{performance.sla_violations ?? 0}</div>
          <div className="text-xs text-gray-600">SLA Violations</div>
        </button>
      </div>

      {/* 🏆 OVERALL PERFORMANCE RATING: Calculated score with visual feedback */}
      {/* 💡 PRESENTATION HINT: "System automatically calculates rating based on all metrics" */}
      <div className={`p-4 rounded-lg transition-all duration-300 ${ratingColor}`}>
        <div className="text-center">
          <div className="text-sm font-medium mb-1">Performance Rating</div>
          <div className="text-xl sm:text-2xl font-bold">{performance.performance_rating ?? 'N/A'}</div>
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