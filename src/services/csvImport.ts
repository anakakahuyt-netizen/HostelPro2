/*
 * ARCHITECTURE LOCK - HostelPro V1.2
 * CSV import rules and room price mappings are locked and must not be changed.
 * Only add comments or type refinements; do not change mapping logic.
 */

import type { Boarder, Room, Payment } from '../types'
import { computePaymentStatus } from '../store/paymentStore'
import { getTodayDate } from '../utils/dateUtils'
import { getRoomOccupants } from '../utils/boarderLedger'

export interface CsvImportPreview {
  rooms: Room[]
  boarders: Boarder[]
  payments: Payment[]
  roomsFound: number
  boardersFound: number
  emptyBeds: number
  // rows that will be skipped during import with reason
  skippedRows: Array<{ row: number; name?: string; roomNumber?: string; reason: string }> 
  duplicates: Array<{ name: string; phone: string }>
}

export interface CsvRow {
  rowNumber?: number
  roomNo?: string
  name?: string
  rent?: string
  date?: string
  currentDue?: string
  originalDue?: string
  phone?: string
}

/**
 * Parse CSV file and return raw rows
 */
export function parseCsv(content: string): CsvRow[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  // Parse header
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const columnMap: Record<string, number> = {}

  // Map column names to indices - order matters to avoid false positives
  for (let i = 0; i < header.length; i++) {
    const col = header[i]
    // Check for current/original due BEFORE checking for rent (to avoid substring match)
    if (col === 'current due' || (col.includes('current') && col.includes('due'))) {
      columnMap['currentDue'] = i
    } else if (col === 'original due' || (col.includes('original') && col.includes('due'))) {
      columnMap['originalDue'] = i
    } else if (col.includes('room')) {
      columnMap['roomNo'] = i
    } else if (col.includes('name')) {
      columnMap['name'] = i
    } else if (col === 'rent' || col.includes('rent')) {
      columnMap['rent'] = i
    } else if (col.includes('date')) {
      columnMap['date'] = i
    } else if (col.includes('phone')) {
      columnMap['phone'] = i
    }
  }

  const rows: CsvRow[] = []

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map((p) => p.trim())
    if (parts.length === 0 || parts.every((p) => !p)) continue

    const row: CsvRow = {
      rowNumber: i + 1,
      roomNo: columnMap['roomNo'] !== undefined ? parts[columnMap['roomNo']] || undefined : undefined,
      name: columnMap['name'] !== undefined ? parts[columnMap['name']] || undefined : undefined,
      rent: columnMap['rent'] !== undefined ? parts[columnMap['rent']] || undefined : undefined,
      date: columnMap['date'] !== undefined ? parts[columnMap['date']] || undefined : undefined,
      currentDue: columnMap['currentDue'] !== undefined ? parts[columnMap['currentDue']] || undefined : undefined,
      originalDue: columnMap['originalDue'] !== undefined ? parts[columnMap['originalDue']] || undefined : undefined,
      phone: columnMap['phone'] !== undefined ? parts[columnMap['phone']] || undefined : undefined,
    }

    rows.push(row)
  }

  return rows
}

/**
 * Generate import preview from CSV rows
 */
export function generateImportPreview(rows: CsvRow[], existingBoarders: Boarder[] = []): CsvImportPreview {
  const roomMap = new Map<string, CsvRow[]>()
  const seenBoarders = new Set<string>()
  const duplicates: Array<{ name: string; phone: string }> = []
  const skippedRows: Array<{ row: number; name?: string; roomNumber?: string; reason: string }> = []

  // Group rows by room number
  for (const row of rows) {
    // keep rows without roomNo for reporting (they are skipped later)
    if (!row.roomNo) {
      skippedRows.push({ row: row.rowNumber || 0, name: row.name || '', roomNumber: row.roomNo || '', reason: 'Missing room number' })
      continue
    }
    if (!roomMap.has(row.roomNo)) {
      roomMap.set(row.roomNo, [])
    }
    roomMap.get(row.roomNo)!.push(row)
  }

  // Create rooms
  const rooms: Room[] = []
  const roomIds = new Map<string, string>()
  // roomCounter deprecated - room ids derived from room numbers

  for (const [roomNo, roomRows] of roomMap) {
    const capacity = roomRows.length
    const occupied = roomRows.filter((r) => r.name && r.name.trim()).length
    // Room identity must derive from room number. Normalize to R-<number> format.
    const normalizedRoomNo = roomNo.startsWith('R-') ? roomNo : `R-${roomNo}`
    const roomId = normalizedRoomNo

    roomIds.set(roomNo, roomId)

    // Determine price from room number ranges (building mapping)
    function getPriceFromRoomNumber(rn: string): number | null {
      const digits = Number(rn.replace(/\D/g, ''))
      if (Number.isNaN(digits)) return 0

      // Old Building
      if (digits >= 101 && digits <= 105) return 1300
      if (digits >= 201 && digits <= 205) return 1300
      if (digits >= 301 && digits <= 305) return 1200

      // New Building
      if (digits >= 1001 && digits <= 1008) return 1400
      if (digits >= 2001 && digits <= 2008) {
        if (digits === 2003) return 1700
        return 1500
      }
      if (digits >= 3001 && digits <= 3007) {
        // 3004 and 3008 do not exist; if 3004 present, treat as unavailable (price 0)
        if (digits === 3004 || digits === 3008) return 0
        return 1500
      }

      // Default fallback: try CSV rent if provided, else 0
      return roomRows[0]?.rent ? parseFloat(roomRows[0].rent) || 0 : 0
    }

    const price = getPriceFromRoomNumber(normalizedRoomNo) ?? 0

    // Ensure roomNumber remains exactly as CSV in the Room object (per rules)

    rooms.push({
      id: roomId,
      roomNumber: roomNo,
      name: roomNo,
      type: capacity === 1 ? 'Single' : capacity === 2 ? 'Double' : capacity === 3 ? 'Triple' : 'Quad',
      floor: 1,
      capacity,
      occupied,
      price,
      status: occupied === capacity ? 'Occupied' : occupied > 0 ? 'Limited' : 'Available',
      amenities: [],
    })
  }

  // Create boarders and payments
  const boarders: Boarder[] = []
  const payments: Payment[] = []
  // Build existing set using name + phone + roomNumber (roomNumber derived from stored room id when needed)
  const existingSet = new Set(existingBoarders.map((b) => {
    // derive original room number from stored room id if it was normalized as R-<roomNo>
    const roomNumber = b.room && typeof b.room === 'string' && b.room.startsWith('R-') ? b.room.slice(2) : b.room || ''
    return `${b.name?.toLowerCase() || ''}|${b.phone || ''}|${roomNumber}`
  }))

  // Count of rows that have a name (non-empty)
  const nameRowsCount = rows.filter((r) => r.name && r.name.trim()).length

  for (const row of rows) {
    if (!row.name || !row.name.trim()) continue // empty-name rows are empty seats, already accounted in room capacity
    if (!row.roomNo) {
      // already reported earlier during grouping, but ensure we still add to skippedRows
      skippedRows.push({ row: row.rowNumber || 0, name: row.name || '', roomNumber: row.roomNo || '', reason: 'Missing room number' })
      continue
    }

    const nameNorm = row.name.trim().toLowerCase()
    const phoneNorm = row.phone ? row.phone.trim() : ''
    // Duplicate key: name + room number; if phone exists include phone
    const dupKey = phoneNorm ? `${nameNorm}|${phoneNorm}|${row.roomNo}` : `${nameNorm}||${row.roomNo}`

    if (existingSet.has(dupKey)) {
      skippedRows.push({ row: row.rowNumber || 0, name: row.name || '', roomNumber: row.roomNo, reason: 'Already exists in system' })
      duplicates.push({ name: row.name, phone: row.phone || 'N/A' })
      continue
    }

    if (seenBoarders.has(dupKey)) {
      skippedRows.push({ row: row.rowNumber || 0, name: row.name || '', roomNumber: row.roomNo, reason: 'Duplicate in CSV' })
      duplicates.push({ name: row.name, phone: row.phone || 'N/A' })
      continue
    }

    seenBoarders.add(dupKey)

    const roomId = roomIds.get(row.roomNo)!
    // Boarder ID derived from name + room (sanitized)
    const sanitized = row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const boarderId = `${sanitized}-${roomId}`

    // CSV 'date' column is a payment date, not check-in. Use import date as default check-in.
    const defaultCheckIn = getTodayDate()

    // monthlyRent must come from room price (enforced by room mapping)
    const room = rooms.find((r) => r.id === roomId)
    const monthlyRent = room?.price || 0

    boarders.push({
      id: boarderId,
      name: row.name,
      email: `${row.name.toLowerCase().replace(/\s+/g, '.')}@hostel.local`,
      phone: row.phone || '',
      room: roomId,
      monthlyRent,
      status: 'ACTIVE',
      checkIn: defaultCheckIn,
      checkOut: '',
      // Persist CSV due fields when present
      openingDue: row.originalDue !== undefined && row.originalDue !== '' ? parseFloat(row.originalDue) || 0 : undefined,
      currentMonthDue: row.currentDue !== undefined && row.currentDue !== '' ? parseFloat(row.currentDue) || 0 : undefined,
    })
    
    // Create payment record from CSV Date column (date is payment date)
    // Payment amount should use the room's mapped price from rent rules (not CSV rent field)
    const paymentDate = row.date || getTodayDate()
    const amount = room?.price || 0
    // generate unique payment id within preview
    const baseId = `PAY-${paymentDate.replace(/-/g, '')}-${String(roomId).replace(/[^A-Z0-9]/ig, '')}`
    let pid = baseId
    let suffix = 1
    while (payments.some((p) => p.id === pid)) {
      suffix++
      pid = `${baseId}-${suffix}`
    }
    const payment: Payment = {
      id: pid,
      boarderId: boarderId,
      guest: row.name || '',
      room: roomId,
      amount,
      date: paymentDate,
      dueDate: '',
      status: 'Pending',
      method: 'Cash',
      notes: '',
    }
    payment.status = computePaymentStatus(payment, rooms, boarders)
    payments.push(payment)
    
  }

  // Calculate empty beds using getRoomOccupants as source of truth
  let emptyBeds = 0
  for (const room of rooms) {
    const occupants = getRoomOccupants(room.id, boarders, payments, rooms)
    emptyBeds += Math.max(0, room.capacity - occupants.length)
  }

  return {
    rooms,
    boarders,
    payments,
    roomsFound: rooms.length,
    // Boarders found should reflect the number of rows with names in the CSV
    boardersFound: nameRowsCount,
    emptyBeds,
    skippedRows,
    duplicates,
  }
}


/**
 * Validate import preview before committing
 */
export function validateImportPreview(preview: CsvImportPreview): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (preview.roomsFound === 0) errors.push('No rooms found in CSV')
  if (preview.boardersFound === 0) errors.push('No boarders found in CSV')
  if (preview.skippedRows && preview.skippedRows.length > 0) errors.push(`${preview.skippedRows.length} row(s) will be skipped`)
  if (preview.duplicates && preview.duplicates.length > 0) errors.push(`${preview.duplicates.length} duplicate(s) detected`)

  return {
    valid: errors.length === 0,
    errors,
  }
}

