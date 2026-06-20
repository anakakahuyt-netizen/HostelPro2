/*
 * ARCHITECTURE LOCK - HostelPro V1.2
 * Dashboard KPI calculations per Phase 14 specification.
 * Core formulas and definitions are locked. Only non-functional comments/types allowed.
 */

import type { Boarder, Payment, Room } from '../types'
import { getBoarderTotals, getDerivedBoarderStatus, normalizeBoarderStatus, isBoarderOccupyingBed } from './boarderLedger'

export interface DashboardKpis {
  totalBoarders: number
  activeBoarders: number
  bookedBoarders: number
  checkedOutBoarders: number
  closedBoarders: number

  checkedOutWithDue: number
  checkedOutCleared: number

  totalRooms: number
  totalSeats: number
  occupiedSeats: number
  availableSeats: number

  monthlyExpectedRevenue: number
  monthlyExpectedRevenueActive: number
  monthlyExpectedRevenueBooked: number

  monthlyEarnedRevenue: number
  monthlyEarnedRevenueActive: number
  monthlyEarnedRevenueAdvance: number
  monthlyEarnedRevenueCheckedOut: number

  totalDueAmount: number
  totalDueActive: number
  totalDueCheckedOut: number

  recentPayments: Payment[]
  quickAlerts: {
    boardersWithDue: number
    availableSeats: number
    upcomingBookedActivations: number
    checkedOutWithUnpaidDues: number
  }
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function parseMonth(value?: string): string {
  if (!value) return ''
  const sanitized = value.trim()
  if (/^\d{4}-\d{2}$/.test(sanitized)) return sanitized
  if (/^\d{4}-\d{2}-\d{2}$/.test(sanitized)) return sanitized.slice(0, 7)
  return ''
}

function nextMonth(month: string): string {
  const [yearStr, monthStr] = month.split('-')
  const year = Number(yearStr)
  const mon = Number(monthStr)
  if (Number.isNaN(year) || Number.isNaN(mon)) return ''
  const next = new Date(year, mon, 1)
  if (Number.isNaN(next.getTime())) return ''
  return monthKey(next)
}

export function calculateDashboardKpis(
  boarders: Boarder[],
  rooms: Room[],
  payments: Payment[]
): DashboardKpis {
  const now = new Date()
  const currentMonth = monthKey(now)
  const nextMonthKey = nextMonth(currentMonth)

  // Compute derived statuses for all boarders
  const derivedStatuses: Record<string, string> = {}
  const boarderDues: Record<string, number> = {}

  boarders.forEach((b) => {
    const room = rooms.find((r) => r.id === b.room || r.roomNumber === b.room)
    const paymentsFor = payments.filter((p) => p.boarderId === b.id)
    const normalized = normalizeBoarderStatus(b.status)
    const effectiveStatus = normalized === 'CHECKED_OUT' ? 'CHECKED_OUT' : getDerivedBoarderStatus(b, 0)
    const { totalDue } = getBoarderTotals(b, paymentsFor, room, effectiveStatus)
    const derived = getDerivedBoarderStatus(b, totalDue)
    derivedStatuses[b.id] = derived
    boarderDues[b.id] = totalDue
  })

  // Boarder counts
  const activeBoarders = boarders.filter((b) => derivedStatuses[b.id] === 'ACTIVE').length
  const bookedBoarders = boarders.filter((b) => derivedStatuses[b.id] === 'BOOKED').length
  const checkedOutBoarders = boarders.filter((b) => derivedStatuses[b.id] === 'CHECKED_OUT').length
  const closedBoarders = boarders.filter((b) => derivedStatuses[b.id] === 'CLOSED').length

  // Checked-out with due/cleared
  const checkedOutBoardersList = boarders.filter((b) => derivedStatuses[b.id] === 'CHECKED_OUT')
  const checkedOutWithDue = checkedOutBoardersList.filter((b) => boarderDues[b.id] > 0).length
  const checkedOutCleared = checkedOutBoardersList.filter((b) => boarderDues[b.id] <= 0).length

  // Room/seat counts
  const totalRooms = rooms.length
  const totalSeats = rooms.reduce((sum, r) => sum + r.capacity, 0)
  const occupiedSeats = boarders.filter((b) => {
    const room = rooms.find((r) => r.id === b.room || r.roomNumber === b.room)
    const paymentsFor = payments.filter((p) => p.boarderId === b.id)
    return isBoarderOccupyingBed(b, paymentsFor, room)
  }).length
  const availableSeats = Math.max(0, totalSeats - occupiedSeats)

  // Monthly Expected Revenue = active monthly rents + booked boarders activating this month
  let monthlyExpectedRevenueActive = 0
  let monthlyExpectedRevenueBooked = 0

  boarders.forEach((b) => {
    const room = rooms.find((r) => r.id === b.room || r.roomNumber === b.room)
    const roomPrice = room?.price || 0

    if (derivedStatuses[b.id] === 'ACTIVE') {
      monthlyExpectedRevenueActive += roomPrice
    }

    // Booked boarder activating this month
    if (derivedStatuses[b.id] === 'BOOKED') {
      const moveInMonth = parseMonth(b.moveInMonth || b.checkIn)
      if (moveInMonth === currentMonth) {
        monthlyExpectedRevenueBooked += roomPrice
      }
    }
  })

  const monthlyExpectedRevenue = monthlyExpectedRevenueActive + monthlyExpectedRevenueBooked

  // Monthly Earned Revenue = payments collected this month (by payment date)
  let monthlyEarnedRevenueActive = 0
  let monthlyEarnedRevenueAdvance = 0
  let monthlyEarnedRevenueCheckedOut = 0

  payments.forEach((p) => {
    if (!p.date || p.date.slice(0, 7) !== currentMonth) return
    const boarder = boarders.find((b) => b.id === p.boarderId)
    if (!boarder) return
    const status = derivedStatuses[boarder.id]
    if (status === 'ACTIVE') monthlyEarnedRevenueActive += p.amount
    else if (status === 'BOOKED') monthlyEarnedRevenueAdvance += p.amount
    else if (status === 'CHECKED_OUT') monthlyEarnedRevenueCheckedOut += p.amount
  })

  const monthlyEarnedRevenue = monthlyEarnedRevenueActive + monthlyEarnedRevenueAdvance + monthlyEarnedRevenueCheckedOut

  // Total Due Amount = active due + checked-out due
  const totalDueActive = boarders
    .filter((b) => derivedStatuses[b.id] === 'ACTIVE')
    .reduce((sum, b) => sum + (boarderDues[b.id] || 0), 0)

  const totalDueCheckedOut = boarders
    .filter((b) => derivedStatuses[b.id] === 'CHECKED_OUT')
    .reduce((sum, b) => sum + (boarderDues[b.id] || 0), 0)

  const totalDueAmount = totalDueActive + totalDueCheckedOut

  // Recent payments (latest 5-10)
  const recentPayments = payments.slice().sort((a, b) => {
    const dateA = new Date(a.date || '').getTime()
    const dateB = new Date(b.date || '').getTime()
    return dateB - dateA
  }).slice(0, 10)

  // Quick Alerts
  const boardersWithDue = boarders.filter((b) => boarderDues[b.id] > 0 && derivedStatuses[b.id] !== 'CLOSED').length

  const upcomingBookedActivations = boarders.filter((b) => {
    if (derivedStatuses[b.id] !== 'BOOKED') return false
    const moveInMonth = parseMonth(b.moveInMonth || b.checkIn)
    return moveInMonth === nextMonthKey
  }).length

  const checkedOutWithUnpaidDues = boarders.filter((b) => {
    if (derivedStatuses[b.id] !== 'CHECKED_OUT') return false
    return boarderDues[b.id] > 0
  }).length

  return {
    totalBoarders: boarders.length,
    activeBoarders,
    bookedBoarders,
    checkedOutBoarders,
    closedBoarders,

    checkedOutWithDue,
    checkedOutCleared,

    totalRooms,
    totalSeats,
    occupiedSeats,
    availableSeats,

    monthlyExpectedRevenue,
    monthlyExpectedRevenueActive,
    monthlyExpectedRevenueBooked,

    monthlyEarnedRevenue,
    monthlyEarnedRevenueActive,
    monthlyEarnedRevenueAdvance,
    monthlyEarnedRevenueCheckedOut,

    totalDueAmount,
    totalDueActive,
    totalDueCheckedOut,

    recentPayments,
    quickAlerts: {
      boardersWithDue,
      availableSeats,
      upcomingBookedActivations,
      checkedOutWithUnpaidDues,
    },
  }
}
