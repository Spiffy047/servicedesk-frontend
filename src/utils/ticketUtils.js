

export const TICKET_STATUSES = {
  NEW: 'New',
  OPEN: 'Open', 
  PENDING: 'Pending',
  CLOSED: 'Closed'
}

export const TICKET_PRIORITIES = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
}

export const STATUS_TRANSITIONS = {
  [TICKET_STATUSES.NEW]: [TICKET_STATUSES.OPEN, TICKET_STATUSES.CLOSED],
  [TICKET_STATUSES.OPEN]: [TICKET_STATUSES.PENDING, TICKET_STATUSES.CLOSED],
  [TICKET_STATUSES.PENDING]: [TICKET_STATUSES.OPEN, TICKET_STATUSES.CLOSED],
  [TICKET_STATUSES.CLOSED]: []
}

export const getValidTransitions = (currentStatus) => {
  return STATUS_TRANSITIONS[currentStatus] || []
}

export const canTransitionTo = (currentStatus, newStatus) => {
  return getValidTransitions(currentStatus).includes(newStatus)
}

export const getStatusColor = (status) => {
  const colors = {
    [TICKET_STATUSES.NEW]: 'bg-blue-100 text-blue-800',
    [TICKET_STATUSES.OPEN]: 'bg-green-100 text-green-800',
    [TICKET_STATUSES.PENDING]: 'bg-yellow-100 text-yellow-800',
    [TICKET_STATUSES.CLOSED]: 'bg-gray-100 text-gray-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export const getPriorityColor = (priority) => {
  const colors = {
    [TICKET_PRIORITIES.LOW]: 'bg-gray-100 text-gray-800',
    [TICKET_PRIORITIES.MEDIUM]: 'bg-yellow-100 text-yellow-800',
    [TICKET_PRIORITIES.HIGH]: 'bg-orange-100 text-orange-800',
    [TICKET_PRIORITIES.CRITICAL]: 'bg-red-100 text-red-800'
  }
  return colors[priority] || 'bg-gray-100 text-gray-800'
}

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const validateFileUpload = (file, limits) => {
  const errors = []
  
  if (!file) {
    errors.push('No file selected')
    return { valid: false, errors }
  }
  
  if (file.size === 0) {
    errors.push('File is empty')
  }
  
  if (file.size > limits.maxFileSize) {
    errors.push(`File too large (max: ${formatFileSize(limits.maxFileSize)})`)
  }
  
  const extension = file.name.split('.').pop().toLowerCase()
  if (!limits.allowedExtensions.includes(extension)) {
    errors.push('File type not allowed')
  }
  
  return {
    valid: errors.length === 0,
    errors,
    size: file.size,
    extension
  }
}

export const getFileIcon = (filename) => {
  const extension = filename.split('.').pop().toLowerCase()
  const icons = {
    png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', svg: '🖼️',
    pdf: '📄', doc: '📄', docx: '📄', txt: '📄',
    zip: '📦', rar: '📦', '7z': '📦',
    js: '💻', py: '💻', html: '💻', css: '💻',
    log: '📋', csv: '📋'
  }
  return icons[extension] || '📎'
}

export const SLA_TARGETS = {
  Critical: 4,
  High: 8,
  Medium: 24,
  Low: 72
}

export const calculateHoursOpen = (createdAt) => {
  const now = new Date()
  const created = new Date(createdAt)
  return (now - created) / (1000 * 60 * 60)
}

export const checkSLAViolation = (ticket) => {
  if (ticket.status === 'Closed') return false
  const hoursOpen = calculateHoursOpen(ticket.created_at)
  const target = SLA_TARGETS[ticket.priority] || 24
  return hoursOpen > target
}

export const getAvailableStatuses = (currentStatus) => {
  return STATUS_TRANSITIONS[currentStatus] || []
}

export const shouldAutoAssign = (ticket) => {
  return ticket.priority === 'Critical' && !ticket.assigned_to
}

export const getEscalationRules = (ticket) => {
  const hoursOpen = calculateHoursOpen(ticket.created_at)
  const rules = []
  
  if (ticket.priority === 'Critical' && hoursOpen > 2) {
    rules.push({ type: 'escalate', reason: 'Critical ticket open > 2 hours' })
  }
  if (ticket.priority === 'High' && hoursOpen > 4) {
    rules.push({ type: 'escalate', reason: 'High priority ticket open > 4 hours' })
  }
  if (hoursOpen > 24 && !ticket.assigned_to) {
    rules.push({ type: 'auto_assign', reason: 'Unassigned ticket > 24 hours' })
  }
  
  return rules
}

export const validateWorkflow = (ticket, newStatus, userRole) => {
  const errors = []
  
  if (!canTransitionTo(ticket.status, newStatus)) {
    errors.push(`Cannot transition from ${ticket.status} to ${newStatus}`)
  }
  
  if (newStatus === 'Closed' && userRole === 'Normal User' && ticket.created_by !== ticket.assigned_to) {
    errors.push('Only assigned agent can close ticket')
  }
  
  return { isValid: errors.length === 0, errors }
}