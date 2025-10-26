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

export const getAgingBucket = (createdAt) => {
  const hoursOpen = calculateHoursOpen(createdAt)
  
  if (hoursOpen < 24) return { range: '0-24 hours', color: 'blue' }
  if (hoursOpen < 48) return { range: '24-48 hours', color: 'amber' }
  if (hoursOpen < 72) return { range: '48-72 hours', color: 'orange' }
  return { range: '72+ hours', color: 'red' }
}

export const getAgingBadgeClass = (createdAt) => {
  const bucket = getAgingBucket(createdAt)
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    amber: 'bg-amber-100 text-amber-800',
    orange: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-800'
  }
  return colorClasses[bucket.color]
}

export const formatHoursOpen = (hoursOpen) => {
  if (hoursOpen < 1) return `${Math.round(hoursOpen * 60)}m`
  if (hoursOpen < 24) return `${Math.round(hoursOpen)}h`
  const days = Math.floor(hoursOpen / 24)
  const hours = Math.round(hoursOpen % 24)
  return `${days}d ${hours}h`
}

// Workflow utilities
export const TICKET_STATUSES = {
  NEW: 'New',
  OPEN: 'Open', 
  PENDING: 'Pending',
  CLOSED: 'Closed'
}

export const VALID_TRANSITIONS = {
  [TICKET_STATUSES.NEW]: [TICKET_STATUSES.OPEN, TICKET_STATUSES.CLOSED],
  [TICKET_STATUSES.OPEN]: [TICKET_STATUSES.PENDING, TICKET_STATUSES.CLOSED],
  [TICKET_STATUSES.PENDING]: [TICKET_STATUSES.OPEN, TICKET_STATUSES.CLOSED],
  [TICKET_STATUSES.CLOSED]: []
}

export const canTransitionTo = (currentStatus, newStatus) => {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) || false
}

export const getAvailableStatuses = (currentStatus) => {
  return VALID_TRANSITIONS[currentStatus] || []
}

export const shouldAutoAssign = (ticket) => {
  return ticket.priority === 'Critical' && !ticket.assigned_to
}
