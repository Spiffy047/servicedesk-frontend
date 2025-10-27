import { useEffect, useState, useMemo, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import PropTypes from 'prop-types'

const API_URL = 'http://localhost:5002/api'

/**
 * RealtimeSLADashboard displays real-time SLA adherence metrics and analytics
 * @param {Object} props - Component props
 * @param {Function} props.onCardClick - Callback function when metric cards are clicked
 * @returns {JSX.Element} The rendered SLA dashboard component
 */
export default function RealtimeSLADashboard({ onCardClick }) {
  const [slaData, setSlaData] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [allTickets, setAllTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true)

  const fetchSLAData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [slaResponse, ticketsResponse] = await Promise.all([
        fetch(`${API_URL}/sla/realtime-adherence`),
        fetch(`${API_URL}/tickets`)
      ])
      
      if (!slaResponse.ok || !ticketsResponse.ok) {
        throw new Error('Failed to fetch SLA data')
      }
      
      const data = await slaResponse.json()
      const tickets = await ticketsResponse.json()
      setSlaData(data)
      setAllTickets(tickets)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err.message)
      console.error('Failed to fetch SLA data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSLAData()
    const interval = setInterval(fetchSLAData, 30000)
    return () => clearInterval(interval)
  }, [fetchSLAData])

  const priorityChartData = useMemo(() => 
    Object.entries(slaData?.priority_breakdown || {}).map(([priority, data]) => ({
      priority,
      'Met SLA': data.met_sla,
      'Violated SLA': data.violated_sla,
      adherence: data.adherence_percentage
    })), [slaData])

  const timeAnalysisData = useMemo(() => 
    Object.entries(slaData?.time_analysis || {}).map(([period, data]) => ({
      period: period.replace('last_', '').replace('h', ' hours').replace('d', ' days'),
      'Met SLA': data.met_sla,
      'Violated': data.violated_sla,
      adherence: data.adherence_percentage
    })), [slaData])

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchSLAData}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (loading || !slaData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Real-Time SLA Adherence</h3>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span>Last updated: {lastUpdate?.toLocaleTimeString()}</span>
              {isAutoRefreshing && (
                <span className="flex items-center gap-1 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Auto-refresh
                </span>
              )}
            </div>
            <button 
              onClick={fetchSLAData}
              disabled={loading}
              className="text-gray-500 hover:text-gray-700 disabled:opacity-50 p-1 rounded"
              title="Refresh data"
            >
              🔄
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <button 
            className="bg-blue-50 rounded-lg p-4 hover:shadow-lg transition-shadow w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500" 
            onClick={() => onCardClick?.({ title: 'All Tickets', data: allTickets })}
            aria-label="View all tickets"
          >
            <div className="text-sm text-gray-600">Total Tickets</div>
            <div className="text-3xl font-bold text-blue-600">{slaData.overall?.total_tickets ?? 0}</div>
          </button>
          
          <button 
            className="bg-green-50 rounded-lg p-4 hover:shadow-lg transition-shadow w-full text-left focus:outline-none focus:ring-2 focus:ring-green-500" 
            onClick={() => onCardClick?.({ title: 'Met SLA (Closed)', data: allTickets.filter(t => t.status === 'Closed' && !t.sla_violated) })}
            aria-label="View tickets that met SLA"
          >
            <div className="text-sm text-gray-600">Met SLA (Closed)</div>
            <div className="text-3xl font-bold text-green-600">{slaData.overall?.closed_met_sla ?? 0}</div>
            <div className="text-xs text-gray-500 mt-1">
              {slaData.overall?.closed_adherence_percentage ?? 0}% adherence
            </div>
          </button>
          
          <button 
            className="bg-red-50 rounded-lg p-4 hover:shadow-lg transition-shadow w-full text-left focus:outline-none focus:ring-2 focus:ring-red-500" 
            onClick={() => onCardClick?.({ title: 'Violated SLA Tickets', data: allTickets.filter(t => t.sla_violated) })}
            aria-label="View SLA violated tickets"
          >
            <div className="text-sm text-gray-600">Violated SLA</div>
            <div className="text-3xl font-bold text-red-600">
              {(slaData.overall?.closed_violated_sla ?? 0) + (slaData.overall?.open_violated ?? 0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {slaData.overall?.open_violated ?? 0} currently open
            </div>
          </button>
          
          <button 
            className="bg-amber-50 rounded-lg p-4 hover:shadow-lg transition-shadow w-full text-left focus:outline-none focus:ring-2 focus:ring-amber-500" 
            onClick={() => onCardClick?.({ title: 'At Risk Tickets', data: allTickets.filter(t => t.status !== 'Closed' && !t.sla_violated) })}
            aria-label="View at-risk tickets"
          >
            <div className="text-sm text-gray-600">At Risk</div>
            <div className="text-3xl font-bold text-amber-600">{slaData.overall?.open_at_risk ?? 0}</div>
            <div className="text-xs text-gray-500 mt-1">Open tickets near SLA</div>
          </button>
        </div>

        <div className="mb-6">
          <h4 className="text-md font-semibold mb-3">SLA Adherence by Priority</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Met SLA" fill="#10b981" />
              <Bar dataKey="Violated SLA" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-semibold mb-3">Priority Breakdown</h4>
            <div className="space-y-3">
              {Object.entries(slaData.priority_breakdown || {}).map(([priority, data]) => (
                <div key={priority} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-medium px-2 py-1 rounded text-sm ${
                      priority === 'Critical' ? 'bg-red-100 text-red-800' :
                      priority === 'High' ? 'bg-orange-100 text-orange-800' :
                      priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {priority}
                    </span>
                    <span className={`font-bold ${
                      data.adherence_percentage >= 90 ? 'text-green-600' :
                      data.adherence_percentage >= 75 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {data.adherence_percentage}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {data.met_sla} met / {data.violated_sla} violated
                    <span className="ml-2 text-xs">(Target: {data.target_hours}h)</span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        data.adherence_percentage >= 90 ? 'bg-green-500' :
                        data.adherence_percentage >= 75 ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${data.adherence_percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-md font-semibold mb-3">Average Resolution Times</h4>
            <div className="space-y-3">
              {Object.entries(slaData.average_resolution_times || {}).map(([priority, data]) => (
                <div key={priority} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{priority}</span>
                    <span className={`font-bold ${
                      data.within_target ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {data.average_hours}h
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Target: {data.target_hours}h
                    {data.within_target ? (
                      <span className="ml-2 text-green-600">✓ Within target</span>
                    ) : (
                      <span className="ml-2 text-red-600">✗ Exceeds target</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {timeAnalysisData.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-semibold mb-3">Time-Based Analysis</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={timeAnalysisData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Met SLA" fill="#10b981" />
                <Bar dataKey="Violated" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">SLA Targets</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          {Object.entries(slaData.sla_targets || {}).map(([priority, hours]) => (
            <div key={priority} className="bg-white rounded p-2">
              <span className="font-medium">{priority}:</span> {hours}h
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

RealtimeSLADashboard.propTypes = {
  onCardClick: PropTypes.func
}