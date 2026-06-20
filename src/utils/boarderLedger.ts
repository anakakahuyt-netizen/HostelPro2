/*
 * ARCHITECTURE LOCK - HostelPro V1.2
 * Ledger calculations are core to system correctness and are locked.
 * DO NOT MODIFY the ledger algorithms or formulas. Only comments or types allowed.
 */

import type { Boarder, BoarderRoomHistoryEntry, Payment, Room } from '../types'

export type NormalizedBoarderStatus = 'ACTIVE' | 'BOOKED' | 'CHECKED_OUT' | 'CLOSED'

export interface PaymentLedgerEntry {
  month: string
  rent: number
  paid: number
  due: number
  advance: number
}

export function normalizeBoarderStatus(status: string): NormalizedBoarderStatus {
  const normalized = String(status || '').trim().toUpperCase()
  if (normalized === 'ACTIVE') return 'ACTIVE'
  if (normalized === 'PENDING' || normalized === 'BOOKED') return 'BOOKED'
  if (normalized === 'CHECKED-OUT' || normalized === 'CHECKED_OUT') return 'CHECKED_OUT'
  if (normalized === 'CLOSED') return 'CLOSED'
  return 'ACTIVE'
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function parseMonth(value?: string) {
  if (!value) return ''
  const sanitized = value.trim()
  if (/^\d{4}-\d{2}$/.test(sanitized)) return sanitized
  if (/^\d{4}-\d{2}-\d{2}$/.test(sanitized)) return sanitized.slice(0, 7)
  return ''
}

function compareMonth(a: string, b: string) {
  if (a === b) return 0
  return a < b ? -1 : 1
}

function nextMonth(month: string) {
  const [yearStr, monthStr] = month.split('-')
  const year = Number(yearStr)
  const mon = Number(monthStr)
  if (Number.isNaN(year) || Number.isNaN(mon)) return ''
  const next = new Date(year, mon, 1)
  if (Number.isNaN(next.getTime())) return ''
  return monthKey(next)
}

function getBoarderAdvanceAmount(boarder: Boarder) {
  // Prefer the new persisted `advanceBalance`, fall back to legacy `advanceAmount`
  return Number(boarder.advanceBalance ?? boarder.advanceAmount ?? 0) || 0
}

export function getDerivedBoarderStatus(boarder: Boarder, totalDue: number): NormalizedBoarderStatus {
  const normalized = normalizeBoarderStatus(boarder.status)
  const currentMonth = monthKey(new Date())
  const moveInMonth = parseMonth(boarder.moveInMonth || boarder.checkIn)
  const checkoutMonth = parseMonth(boarder.checkoutMonth || boarder.checkOut)
  const todayKey = new Date().toISOString().slice(0, 10)

  if (normalized === 'BOOKED') {
    if (moveInMonth && moveInMonth <= currentMonth) return 'ACTIVE'
    return 'BOOKED'
  }

  if (normalized === 'ACTIVE') {
    // If boarder has an explicit checkout date (YYYY-MM-DD) use day-level comparison.
    if (boarder.checkOut && /^\d{4}-\d{2}-\d{2}$/.test(boarder.checkOut)) {
      if (boarder.checkOut <= todayKey) {
        if (totalDue <= 0) return 'CLOSED'
        return 'CHECKED_OUT'
      }
      return 'ACTIVE'
    }

    // Fallback to month-level comparison when only month is provided.
    if (checkoutMonth && checkoutMonth <= currentMonth) {
      if (totalDue <= 0) return 'CLOSED'
      return 'CHECKED_OUT'
    }
    return 'ACTIVE'
  }

  if (normalized === 'CHECKED_OUT') {
    // If a checkout date is in the future, honor the date and keep the boarder ACTIVE
    // until that date arrives (current date drives lifecycle).
    if (boarder.checkOut && /^\d{4}-\d{2}-\d{2}$/.test(boarder.checkOut)) {
      if (boarder.checkOut > todayKey) return 'ACTIVE'
    } else if (checkoutMonth) {
      if (checkoutMonth > currentMonth) return 'ACTIVE'
    }

    if (totalDue <= 0) return 'CLOSED'
    return 'CHECKED_OUT'
  }

  if (normalized === 'CLOSED') {
    return 'CLOSED'
  }

  return normalized
}

export function isArchivedBoarder(boarder: Boarder, totalDue: number) {
  return getDerivedBoarderStatus(boarder, totalDue) === 'CLOSED'
}

function toRoomHistoryEntry(entry: BoarderRoomHistoryEntry | undefined): { roomNumber: string; price: number } | undefined {
  if (!entry) return undefined
  if (typeof entry === 'string') return { roomNumber: entry, price: 0 }
  return entry
}

export function getBoarderRoomInfo(boarder: Boarder, rooms: Room[]) {
  const currentRoom = rooms.find((r) => r.id === boarder.room || r.roomNumber === boarder.room)
  if (currentRoom) {
    return { roomNumber: currentRoom.roomNumber, price: currentRoom.price }
  }
  const history = boarder.roomHistory?.slice().reverse().map(toRoomHistoryEntry).find(Boolean)
  if (history) return history
  return { roomNumber: boarder.room, price: 0 }
}

export function getBoarderRoomPrice(boarder: Boarder, room?: Room) {
  if (room?.price != null) return room.price
  const history = boarder.roomHistory?.slice().reverse().map(toRoomHistoryEntry).find(Boolean)
  return history?.price || 0
}

export function isRentActive(status: string) {
  const normalized = normalizeBoarderStatus(status)
  return normalized === 'ACTIVE' || normalized === 'CHECKED_OUT'
}

export function getRentMonths(boarder: Boarder, effectiveStatus: NormalizedBoarderStatus) {
  const startMonth = parseMonth(boarder.moveInMonth || boarder.checkIn)
  if (!startMonth) return []

  const currentMonth = monthKey(new Date())
  let endMonth = currentMonth

  if (effectiveStatus === 'CHECKED_OUT' || effectiveStatus === 'CLOSED') {
    const checkoutMonth = parseMonth(boarder.checkoutMonth || boarder.checkOut)
    if (checkoutMonth) {
      endMonth = checkoutMonth
    }
  }

  if (compareMonth(startMonth, endMonth) > 0) return []

  const months: string[] = []
  let current = startMonth
  let safety = 0
  while (current && compareMonth(current, endMonth) <= 0) {
    months.push(current)
    current = nextMonth(current)
    safety++
    if (safety > 240) break
  }
  return months
}

export function buildLedger(boarder: Boarder, payments: Payment[], room?: Room, effectiveStatus?: NormalizedBoarderStatus): PaymentLedgerEntry[] {
  const status = effectiveStatus || normalizeBoarderStatus(boarder.status)
  const roomPrice = getBoarderRoomPrice(boarder, room)
  const months = getRentMonths(boarder, status)
  const grouped = payments.reduce<Record<string, number>>((acc, payment) => {
    if (!payment.date) return acc
    const month = payment.date.slice(0, 7)
    acc[month] = (acc[month] || 0) + payment.amount
    return acc
  }, {})
  const ledger: PaymentLedgerEntry[] = []
  let carry = getBoarderAdvanceAmount(boarder)
  for (const month of months) {
    const rent = status === 'BOOKED' || status === 'CLOSED' ? 0 : roomPrice
    const paid = grouped[month] || 0
    const net = carry + paid - rent
    const due = Math.max(0, -net)
    const advance = Math.max(0, net)
    ledger.push({ month, rent, paid, due, advance })
    carry = net
  }
  if (!months.length && status === 'BOOKED') {
    const month = new Date().toISOString().slice(0, 7)
    const paid = payments.reduce((sum, p) => sum + p.amount, 0)
    const net = carry + paid
    const advance = Math.max(0, net)
    ledger.push({ month, rent: 0, paid, due: 0, advance })
  }
  return ledger
}

export function getBoarderTotals(boarder: Boarder, payments: Payment[], room?: Room, effectiveStatus?: NormalizedBoarderStatus) {
  const ledger = buildLedger(boarder, payments, room, effectiveStatus)
  
  // Total rent charged across all generated months
  const totalRent = ledger.reduce((sum, entry) => sum + entry.rent, 0)
  
  // Opening due: previous outstanding balance
  const openingDue = Number(boarder.openingDue ?? 0) || 0
  
  // Total charges = Opening due + All monthly rent generated by ledger
  // This is what the boarder owes in total
  const totalCharges = openingDue + totalRent
  
  // Total paid = All payments received + Advance balance (prepayment credit)
  // This is what reduces the due amount
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const advanceBalance = getBoarderAdvanceAmount(boarder)
  const totalPaid = totalPayments + advanceBalance
  
  // Total due = max(0, totalCharges - totalPaid)
  // What the boarder still owes after accounting for all payments and credits
  const totalDue = Math.max(0, totalCharges - totalPaid)
  
  // Excess credit if totalPaid exceeds totalCharges
  const advance = Math.max(0, totalPaid - totalCharges)
  
  // Current month due: from ledger's latest entry (already has advance/payments applied month-by-month)
  // Do NOT add this to totalCharges as it's already included in the ledger calculation
  const currentMonthDue = ledger.length ? ledger[ledger.length - 1].due : 0

  return { ledger, totalRent, totalPaid, totalCharges, totalDue, advance, openingDue, currentMonthDue }
}

export function isBoarderOccupyingBed(boarder: Boarder, payments: Payment[], room?: Room, referenceMonth = monthKey(new Date())) {
  const normalized = normalizeBoarderStatus(boarder.status)
  const effectiveStatus = normalized === 'CHECKED_OUT' ? 'CHECKED_OUT' : getDerivedBoarderStatus(boarder, 0)
  const { totalDue } = getBoarderTotals(boarder, payments, room, effectiveStatus)
  const derived = getDerivedBoarderStatus(boarder, totalDue)
  // ACTIVE boarders occupy beds
  if (derived === 'ACTIVE') return true

  // BOOKED boarders reserve a room but do NOT occupy (do not count towards occupancy)
  if (derived === 'BOOKED') return false

  // CHECKED_OUT: remain occupying until checkout date arrives (day-level preferred,
  // fallback to month-level). After the checkout date passes they no longer occupy.
  if (derived === 'CHECKED_OUT') {
    if (boarder.checkOut && /^\d{4}-\d{2}-\d{2}$/.test(boarder.checkOut)) {
      const today = new Date().toISOString().slice(0, 10)
      return today < boarder.checkOut
    }
    const checkoutMonth = parseMonth(boarder.checkoutMonth || boarder.checkOut)
    if (checkoutMonth) {
      return compareMonth(referenceMonth, checkoutMonth) < 0
    }
    return false
  }

  return false
}

/**
 * Get all boarders currently occupying a specific room.
 * Uses isBoarderOccupyingBed as single source of truth.
 * Returns array of occupants for room card display, count, and progress calculations.
 */
export function getRoomOccupants(roomId: string | number, boarders: Boarder[], payments: Payment[], rooms: Room[], referenceMonth = monthKey(new Date())): Boarder[] {
  return boarders.filter((boarder) => {
    if (boarder.room !== roomId) return false
    const room = rooms.find((r) => r.id === roomId || r.roomNumber === roomId)
    const paymentsFor = payments.filter((p) => p.boarderId === boarder.id)
    return isBoarderOccupyingBed(boarder, paymentsFor, room, referenceMonth)
  })
}

/**
 * Get all residents for a room for display in resident lists.
 * Includes ACTIVE boarders, BOOKED reservations, and CHECKED_OUT boarders
 * whose checkout date is still in the future (they are still present until checkout).
 * This intentionally differs from `getRoomOccupants` which is a seat-occupancy
 * focused helper (used for counting occupied beds).
 */
export function getRoomResidents(roomId: string | number, boarders: Boarder[], payments: Payment[], rooms: Room[], referenceMonth = monthKey(new Date())): Boarder[] {
  return boarders.filter((boarder) => {
    if (boarder.room !== roomId) return false
    const room = rooms.find((r) => r.id === roomId || r.roomNumber === roomId)
    const paymentsFor = payments.filter((p) => p.boarderId === boarder.id)
    const normalized = normalizeBoarderStatus(boarder.status)
    const effectiveStatus = normalized === 'CHECKED_OUT' ? 'CHECKED_OUT' : getDerivedBoarderStatus(boarder, 0)
    const { totalDue } = getBoarderTotals(boarder, paymentsFor, room, effectiveStatus)
    const derived = getDerivedBoarderStatus(boarder, totalDue)

    if (derived === 'ACTIVE') return true
    if (derived === 'BOOKED') return true
    if (derived === 'CHECKED_OUT') {
      // include future checkouts (still present until checkout date)
      return isBoarderOccupyingBed(boarder, paymentsFor, room, referenceMonth)
    }
    return false
  })
}

/**
 * Phase 12.7 - Lifecycle helpers for boarder automation
 * These encapsulate business rules for ACTIVE, BOOKED, and CHECKED_OUT states.
 */

/**
 * Create a new ACTIVE boarder with automatic activation.
 * - Current month becomes checkIn automatically
 * - Boarder occupies bed immediately
 * Rules: bio (name, email, phone), room, opening due (optional)
 */
export function createActiveBoarder(partial: Partial<Boarder>): Boarder {
  const now = new Date()
  const currentMonth = monthKey(now)
  const [year, month] = currentMonth.split('-')
  const checkInDate = `${year}-${month}-01`

  return {
    id: partial.id || crypto.randomUUID(),
    name: partial.name || '',
    email: partial.email || '',
    phone: partial.phone || '',
    room: partial.room || '',
    monthlyRent: partial.monthlyRent || 0,
    status: 'ACTIVE',
    checkIn: checkInDate,
    checkOut: '',
    openingDue: partial.openingDue || 0,
    advanceBalance: 0,
    notes: partial.notes || '',
    roomHistory: partial.roomHistory || [],
    archived: false,
  }
}

/**
 * Create a new BOOKED boarder with future activation.
 * - moveInMonth is the target activation month (e.g., "2026-10")
 * - One month before activation: occupies bed with BOOKED badge
 * - Activation month: automatically becomes ACTIVE
 * - Advance payment (if provided) should be stored separately in advanceBalance
 * Rules: bio, room, moveInMonth (activation date)
 */
export function createBookedBoarder(partial: Partial<Boarder>): Boarder {
  return {
    id: partial.id || crypto.randomUUID(),
    name: partial.name || '',
    email: partial.email || '',
    phone: partial.phone || '',
    room: partial.room || '',
    monthlyRent: partial.monthlyRent || 0,
    status: 'BOOKED',
    checkIn: '',
    checkOut: '',
    moveInMonth: partial.moveInMonth || '',
    openingDue: 0,
    advanceBalance: partial.advanceBalance || 0,
    notes: partial.notes || '',
    roomHistory: partial.roomHistory || [],
    archived: false,
  }
}
