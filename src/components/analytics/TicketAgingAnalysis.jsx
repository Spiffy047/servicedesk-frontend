import { useEffect, useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PropTypes from 'prop-types'
import { calculateHoursOpen, formatHoursOpen } from '../../utils/ticketUtils'

const API_URL = 'http://localhost:5002/api'

/**
 * TicketAgingAnalysis displays aging analysis of tickets with interactive breakdown
 * @returns {JSX.Element} The rendered ticket aging analysis component
 */
export default function TicketAgingAnalysis() {
  const [agingData, setAgingData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/tickets/analytics/aging`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch aging data')
        return res.json()
      })
      .then(setAgingData)
      .catch(err => {
        setError(err.message)
        console.error(err)
      })
      .finally(() => setLoading(false))
  }, [])

  const chartData = useMemo(() => 
    Object.entries(agingData || {}).map(([bucket, data]) => ({
      bucket,
      count: data?.count ?? 0
    })), [agingData])

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Ticket Aging Analysis</h3>
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
        <h3 className="text-lg font-semibold mb-4">Ticket Aging Analysis</h3>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h3 className="text-lg font-semibold mb-4">Ticket Aging Analysis</h3>
      {chartData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bucket" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-6 space-y-3">
            {Object.entries(agingData || {}).map(([bucket, data]) => (
              (data?.count ?? 0) > 0 && (
                <details key={bucket} className="border rounded-lg hover:shadow-md transition-shadow duration-200" role="group" aria-label={`${bucket} tickets breakdown`}>
                  <summary className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200 font-medium flex justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset" tabIndex="0">
                    <span>{bucket}</span>
                    <span className="text-gray-600">{data?.count ?? 0} tickets</span>
                  </summary>
                  <div className="px-4 py-3 border-t bg-gray-50 space-y-2">
                    {(data?.tickets || []).map(ticket => {
                      const hoursOpen = calculateHoursOpen(ticket.created_at)
                      return (
                        <div key={ticket.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm gap-2">
                          <div className="flex-1">
                            <span className="font-medium">{ticket.id}</span>
                            <span className="text-gray-600 ml-2">{ticket.title}</span>
                            <span className="text-gray-500 ml-2 text-xs">({formatHoursOpen(hoursOpen)} open)</span>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              ticket.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                              ticket.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                              ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {ticket.priority}
                            </span>
                            {ticket.sla_violated && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                SLA Violated
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </details>
              )
            ))}
          </div>
        </>
      ) : (
        <p className="text-gray-500 text-center py-8">No aging data available</p>
      )}
    </div>
  )
}

TicketAgingAnalysis.propTypes = {
  // No props currently, but ready for future expansion
}