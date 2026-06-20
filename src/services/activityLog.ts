export interface ActivityLogEntry {
  id: string
  type: 'BoarderAdded' | 'BookingCreated' | 'PaymentReceived' | 'BoarderCheckedOut' | 'BoarderArchived' | 'BoarderRestored' | 'RoomCreated' | 'RoomUpdated' | 'RoomChanged'
  message: string
  timestamp: string
  boarderId?: string
  roomId?: string
  paymentId?: string
}

const ACTIVITY_LOG_KEY = 'hostelpro_activity_logs'
const MAX_LOG_ENTRIES = 1000
const ACTIVITY_EVENT_NAME = 'hostelpro-activity-log-updated'

function getStoredLogs(): ActivityLogEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(ACTIVITY_LOG_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveStoredLogs(entries: ActivityLogEntry[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(entries))
    window.dispatchEvent(new CustomEvent(ACTIVITY_EVENT_NAME))
  } catch {
    // ignore storage failures silently
  }
}

export function getActivityLogs(): ActivityLogEntry[] {
  return getStoredLogs().slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export function logActivity(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) {
  const timestamp = new Date().toISOString()
  const newEntry: ActivityLogEntry = {
    ...entry,
    id: `${entry.type}-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp,
  }
  const entries = [newEntry, ...getStoredLogs()]
  saveStoredLogs(entries.slice(0, MAX_LOG_ENTRIES))
  return newEntry
}

export function subscribeToActivityLogUpdates(listener: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(ACTIVITY_EVENT_NAME, listener)
  return () => window.removeEventListener(ACTIVITY_EVENT_NAME, listener)
}

export default { getActivityLogs, logActivity, subscribeToActivityLogUpdates }
