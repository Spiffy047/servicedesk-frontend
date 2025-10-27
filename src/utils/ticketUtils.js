// SLA target response times in hours for each priority level
// These define how quickly tickets should be resolved based on their priority
export const SLA_TARGETS = {
  Critical: 4,   // 4 hours - system down, business critical
  High: 8,       // 8 hours - major impact, many users affected
  Medium: 24,    // 1 day - moderate impact, some users affected
  Low: 72        // 3 days - minor impact, few users affected
}

// Calculate how many hours a ticket has been open
// Used for SLA tracking and aging analysis
export const calculateHoursOpen = (createdAt) => {
  const now = new Date()
  const created = new Date(createdAt)
  // Convert milliseconds to hours (1000ms * 60s * 60m = 1 hour)
  return (now - created) / (1000 * 60 * 60)
}

// Check if a ticket has violated its SLA target
// Closed tickets are never considered violated
export const checkSLAViolation = (ticket) => {
  if (ticket.status === 'Closed') return false // Closed tickets don't count
  
  const hoursOpen = calculateHoursOpen(ticket.created_at)
  const target = SLA_TARGETS[ticket.priority] || 24 // Default to 24h if priority unknown
  
  return hoursOpen > target // True if ticket is overdue
}

// Categorize tickets into aging buckets for dashboard display
// Returns both the time range and appropriate color for UI badges
export const getAgingBucket = (createdAt) => {
  const hoursOpen = calculateHoursOpen(createdAt)
  
  // Color coding: blue (fresh) -> amber (aging) -> orange (old) -> red (very old)
  if (hoursOpen < 24) return { range: '0-24 hours', color: 'blue' }     // Fresh tickets
  if (hoursOpen < 48) return { range: '24-48 hours', color: 'amber' }   // Starting to age
  if (hoursOpen < 72) return { range: '48-72 hours', color: 'orange' }  // Getting old
  return { range: '72+ hours', color: 'red' }                           // Very old tickets
}

// Get Tailwind CSS classes for aging badges based on ticket age
// Used to style aging indicators in the UI with appropriate colors
export const getAgingBadgeClass = (createdAt) => {
  const bucket = getAgingBucket(createdAt)
  
  // Tailwind classes for different aging levels
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',       // Fresh - blue background
    amber: 'bg-amber-100 text-amber-800',    // Aging - amber background
    orange: 'bg-orange-100 text-orange-800', // Old - orange background
    red: 'bg-red-100 text-red-800'          // Very old - red background
  }
  
  return colorClasses[bucket.color]
}

// Format hours into human-readable time strings
// Shows minutes for very new tickets, hours for same-day, days+hours for older
export const formatHoursOpen = (hoursOpen) => {
  if (hoursOpen < 1) {
    // Less than 1 hour - show minutes (e.g., "45m")
    return `${Math.round(hoursOpen * 60)}m`
  }
  
  if (hoursOpen < 24) {
    // Less than 1 day - show hours (e.g., "8h")
    return `${Math.round(hoursOpen)}h`
  }
  
  // 1+ days - show days and remaining hours (e.g., "2d 5h")
  const days = Math.floor(hoursOpen / 24)
  const hours = Math.round(hoursOpen % 24)
  return `${days}d ${hours}h`
}
