import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

export default function DataModal({ title, data, onClose }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('id')
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  
  const filteredData = data.filter(item => {
    const matchesSearch = !searchTerm || 
      (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.id && item.id.toString().includes(searchTerm))
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    
    return matchesSearch && matchesStatus
  }).sort((a, b) => {
    const aVal = a[sortBy] || ''
    const bVal = b[sortBy] || ''
    const result = aVal.toString().localeCompare(bVal.toString())
    return sortOrder === 'asc' ? result : -result
  })
  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])
  
  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setSortBy('id')
    setSortOrder('asc')
    setCurrentPage(1)
  }
  
  const exportToCSV = async () => {
    setLoading(true)
    const headers = ['ID', 'Title', 'Status', 'Priority', 'Created', 'Assigned']
    const csvData = filteredData.map(item => [
      item.id || '',
      item.title || '',
      item.status || '',
      item.priority || '',
      item.created_at ? new Date(item.created_at).toLocaleDateString() : '',
      item.assigned_to || ''
    ])
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setLoading(false)
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 id="modal-title" className="text-xl font-bold">
              {title} ({filteredData.length} {filteredData.length === 1 ? 'item' : 'items'})
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                disabled={loading}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Exporting...' : 'Export CSV'}
              </button>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="id">Sort by ID</option>
              <option value="title">Sort by Title</option>
              <option value="created_at">Sort by Date</option>
              <option value="status">Sort by Status</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
              <option value="Pending">Pending</option>
              <option value="New">New</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border rounded-md hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
            <button
              onClick={clearFilters}
              className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {filteredData.length === 0 ? (
            <div className="text-center text-gray-500 py-8">{data.length === 0 ? 'No data available' : 'No matching results'}</div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedData.map((item, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-lg">{item.id || item.title}</div>
                    <div className="flex gap-2">
                      {item.status && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                          item.status === 'Open' ? 'bg-green-100 text-green-800' :
                          item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>{item.status}</span>
                      )}
                      {item.priority && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                          item.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                          item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>{item.priority}</span>
                      )}
                    </div>
                  </div>
                  {item.title && <div className="text-gray-900 mb-1">{item.title}</div>}
                  {item.description && <div className="text-gray-600 text-sm mb-2">{item.description}</div>}
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    {item.category && <div>Category: {item.category}</div>}
                    {item.created_at && <div>Created: {new Date(item.created_at).toLocaleString()}</div>}
                    {item.assigned_to && <div>Assigned: {item.assigned_to}</div>}
                    {item.created_by_name && <div>Created by: {item.created_by_name}</div>}
                    {item.sla_violated !== undefined && (
                      <div className={item.sla_violated ? 'text-red-600 font-medium' : 'text-green-600'}>
                        SLA: {item.sla_violated ? 'Violated' : 'Met'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

DataModal.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired
}