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
  if (normalized === 'ACTIVE' || normalized === 'ACTIVE') return 'ACTIVE'
  if (normalized === 'PENDING' || normalized === 'BOOKED') return 'BOOKED'
  if (normalized === 'CHECKED-OUT' || normalized === 'CHECKED_OUT') return 'CHECKED_OUT'
  if (normalized === 'CLOSED') return 'CLOSED'
  return 'ACTIVE'
}

export function isArchivedBoarder(status: string, totalDue: number) {
  const normalized = normalizeBoarderStatus(status)
  return normalized === 'CLOSED' || (normalized === 'CHECKED_OUT' && totalDue === 0)
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

export function getDerivedBoarderStatus(boarder: Boarder, totalDue: number): NormalizedBoarderStatus {
  const normalized = normalizeBoarderStatus(boarder.status)
  if (normalized === 'CHECKED_OUT' && totalDue === 0) return 'CLOSED'
  return normalized
}

export function isRentActive(status: string) {
  const normalized = normalizeBoarderStatus(status)
  return normalized === 'ACTIVE' || normalized === 'CHECKED_OUT'
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function addMonth(month: string) {
  if (!month || month === 'NaN-NaN' || month.split('-').length !== 2) {
    return ''
  }
  const [yearStr, monthStr] = month.split('-')
  const year = Number(yearStr)
  const mon = Number(monthStr)
  if (Number.isNaN(year) || Number.isNaN(mon)) return ''
  const next = new Date(year, mon, 1)
  if (Number.isNaN(next.getTime())) return ''
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
}

export function getRentMonths(boarder: Boarder): string[] {
  const status = normalizeBoarderStatus(boarder.status)
  if (!boarder.checkIn || status === 'BOOKED') return []
  const start = new Date(boarder.checkIn)
  if (isNaN(start.getTime())) return []
  const end = boarder.checkOut ? new Date(boarder.checkOut) : new Date()
  if (isNaN(end.getTime())) return []

  const months: string[] = []
  let current = monthKey(start)
  const last = monthKey(end)
  let safety = 0
  while (current && current !== last) {
    months.push(current)
    current = addMonth(current)
    safety++
    if (safety > 240) break
  }
  if (last) months.push(last)
  return months
}

export function buildLedger(boarder: Boarder, payments: Payment[], room?: Room): PaymentLedgerEntry[] {
  const status = normalizeBoarderStatus(boarder.status)
  const roomPrice = getBoarderRoomPrice(boarder, room)
  const months = getRentMonths(boarder)
  const grouped = payments.reduce<Record<string, number>>((acc, payment) => {
    if (!payment.date) return acc
    const month = payment.date.slice(0, 7)
    acc[month] = (acc[month] || 0) + payment.amount
    return acc
  }, {})
  const ledger: PaymentLedgerEntry[] = []
  let carry = 0
  for (const month of months) {
    const rent = status === 'BOOKED' ? 0 : roomPrice
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
    const net = paid
    const advance = Math.max(0, net)
    ledger.push({ month, rent: 0, paid, due: 0, advance })
  }
  return ledger
}

export function getBoarderTotals(boarder: Boarder, payments: Payment[], room?: Room) {
  const ledger = buildLedger(boarder, payments, room)
  const totalRent = ledger.reduce((sum, entry) => sum + entry.rent, 0)
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const totalDue = Math.max(0, totalRent - totalPaid)
  const advance = Math.max(0, totalPaid - totalRent)
  return { ledger, totalRent, totalPaid, totalDue, advance }
}
