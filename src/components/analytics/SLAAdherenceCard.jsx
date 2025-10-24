import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

const API_URL = 'http://localhost:5002/api'

/**
 * SLAAdherenceCard displays SLA adherence metrics with visual indicators
 * @returns {JSX.Element} The rendered SLA adherence card component
 */
export default function SLAAdherenceCard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = () => {
    setLoading(true)
    setError(null)
    fetch(`${API_URL}/tickets/analytics/sla-adherence`)
      .then(res => res.json())
      .then(setData)
      .catch(err => {
        setError('Failed to load SLA data')
        console.error(err)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">SLA Adherence</h3>
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-12 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">SLA Adherence</h3>
        <div className="text-center py-4">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const percentage = data?.adherence_percentage ?? 0
  const color = percentage >= 90 ? 'green' : percentage >= 75 ? 'yellow' : 'red'

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">SLA Adherence</h3>
        <button 
          onClick={fetchData}
          disabled={loading}
          className="text-gray-500 hover:text-gray-700 disabled:opacity-50 p-1 rounded"
          title="Refresh data"
        >
          🔄
        </button>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl sm:text-4xl font-bold text-gray-900">{percentage.toFixed(1)}%</div>
          <div className="text-sm text-gray-600 mt-1">
            {data?.met_sla ?? 0} of {data?.total_tickets ?? 0} tickets met SLA
          </div>
        </div>
        <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
          color === 'green' ? 'bg-green-100' :
          color === 'yellow' ? 'bg-yellow-100' : 'bg-red-100'
        }`}>
          <span className={`text-2xl font-bold ${
            color === 'green' ? 'text-green-600' :
            color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {percentage >= 90 ? '✓' : percentage >= 75 ? '!' : '✗'}
          </span>
        </div>
      </div>
      {(data?.violated_sla ?? 0) > 0 && (
        <div className="mt-4 p-3 bg-red-50 rounded-md text-sm text-red-800">
          {data?.violated_sla ?? 0} ticket{(data?.violated_sla ?? 0) !== 1 ? 's' : ''} violated SLA
        </div>
      )}
    </div>
  )
}

SLAAdherenceCard.propTypes = {
  // No props currently, but ready for future expansion
}