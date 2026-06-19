/*
 * ARCHITECTURE LOCK - HostelPro V1.2
 * This file is part of the stable HostelPro V1.2 architecture.
 * DO NOT MODIFY UI, business logic, CSV import rules, ledger calculations, or database shape.
 * Allowed changes: non-functional comments, type declarations, and harmless documentation only.
 */

import { useMemo } from 'react'
import { BarChart3, CreditCard, Home, Users, Layers2, ArrowUpRight, Wallet, CalendarDays } from 'lucide-react'
import { useBoarderStore } from '../store/boarderStore'
import { useRoomStore } from '../store/roomStore'
import { usePaymentStore } from '../store/paymentStore'
import { useNavigate } from 'react-router-dom'
import { getBoarderTotals, getDerivedBoarderStatus, normalizeBoarderStatus, isBoarderOccupyingBed, getRoomOccupants } from '../utils/boarderLedger'

const iconMap = {
  Users,
  Home,
  CreditCard,
  BarChart3,
  Layers2,
  ArrowUpRight,
  Wallet,
  CalendarDays,
}

const DashboardPage = () => {
  const boarders = useBoarderStore((s) => s.boarders)
  const rooms = useRoomStore((s) => s.rooms)
  const payments = usePaymentStore((s) => s.payments)

  // debug log removed

  const navigate = useNavigate()
  const totalRooms = rooms.length

  const derivedBoarderStatuses = useMemo(() => {
    return boarders.map((b) => {
      const room = rooms.find((r) => r.id === b.room || r.roomNumber === b.room)
      const paymentsFor = payments.filter((p) => p.boarderId === b.id)
      const normalized = normalizeBoarderStatus(b.status)
      const effectiveStatus = normalized === 'CHECKED_OUT' ? 'CHECKED_OUT' : getDerivedBoarderStatus(b, 0)
      const { totalDue } = getBoarderTotals(b, paymentsFor, room, effectiveStatus)
      return getDerivedBoarderStatus(b, totalDue)
    })
  }, [boarders, rooms, payments])

  const occupiedRooms = rooms.filter((room) => {
    const occupants = getRoomOccupants(room.id, boarders, payments, rooms)
    return occupants.length > 0
  }).length
  const occupancyRate = totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0
  const totalCapacity = rooms.reduce((s, r) => s + r.capacity, 0)
  const totalOccupiedBeds = boarders.filter((boarder) => {
    const paymentsFor = payments.filter((payment) => payment.boarderId === boarder.id)
    return isBoarderOccupyingBed(boarder, paymentsFor)
  }).length
  const availableBeds = Math.max(0, totalCapacity - totalOccupiedBeds)

  const currentMonthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  // Dashboard room cards - use getRoomOccupants for occupancy display
  const dashboardRoomsWithOccupancy = useMemo(() => rooms.map((room) => {
    const occupants = getRoomOccupants(room.id, boarders, payments, rooms)
    return { ...room, occupied: occupants.length }
  }), [rooms, boarders, payments])

  // Monthly Revenue = sum of room prices of ACTIVE boarders
  const monthlyRevenue = boarders.reduce((sum, boarder, index) => {
    if (derivedBoarderStatuses[index] === 'ACTIVE') {
      const room = rooms.find((r) => r.id === boarder.room || r.roomNumber === boarder.room)
      return sum + (room?.price || 0)
    }
    return sum
  }, 0)

  // Total Advance Balance = sum of all boarders' advance balances
  const totalAdvanceBalance = boarders.reduce((sum, boarder) => {
    const room = rooms.find((r) => r.id === boarder.room || r.roomNumber === boarder.room)
    const paymentsFor = payments.filter((p) => p.boarderId === boarder.id)
    const normalized = normalizeBoarderStatus(boarder.status)
    const effectiveStatus = normalized === 'CHECKED_OUT' ? 'CHECKED_OUT' : getDerivedBoarderStatus(boarder, 0)
    const { advance } = getBoarderTotals(boarder, paymentsFor, room, effectiveStatus)
    return sum + advance
  }, 0)

  const boarderDueEntries = boarders.map((boarder) => {
    const room = rooms.find((r) => r.id === boarder.room || r.roomNumber === boarder.room)
    const paymentsFor = payments.filter((p) => p.boarderId === boarder.id)
    const normalized = normalizeBoarderStatus(boarder.status)
    const effectiveStatus = normalized === 'CHECKED_OUT' ? 'CHECKED_OUT' : getDerivedBoarderStatus(boarder, 0)
    const { totalDue } = getBoarderTotals(boarder, paymentsFor, room, effectiveStatus)
    const derived = getDerivedBoarderStatus(boarder, totalDue)
    return { id: boarder.id, totalDue, derived }
  })
  const totalPendingDues = boarderDueEntries.reduce((s, e) => (e.derived === 'CLOSED' ? s : s + e.totalDue), 0)
  const boardersWithDues = boarderDueEntries.filter((e) => e.derived !== 'CLOSED' && e.totalDue > 0).length

  const activeBoarders = derivedBoarderStatuses.filter((status) => status === 'ACTIVE').length
  const bookedBoarders = derivedBoarderStatuses.filter((status) => status === 'BOOKED').length
  const checkedOutBoarders = derivedBoarderStatuses.filter((status) => status === 'CHECKED_OUT').length
  const closedBoarders = derivedBoarderStatuses.filter((status) => status === 'CLOSED').length

  const metrics = [
    { label: 'Total Boarders', value: String(boarders.length), change: `${activeBoarders} active`, icon: 'Users', accent: 'from-indigo-500 to-sky-500', path: '/boarders' },
    { label: 'Active', value: String(activeBoarders), change: `${bookedBoarders} booked`, icon: 'Users', accent: 'from-emerald-500 to-teal-500', path: '/boarders', state: { section: 'active' } },
    { label: 'Booked', value: String(bookedBoarders), change: `${checkedOutBoarders} checked out`, icon: 'Users', accent: 'from-cyan-500 to-blue-500', path: '/boarders', state: { section: 'booked' } },
    { label: 'Checked-out', value: String(checkedOutBoarders), change: `${closedBoarders} archived`, icon: 'Users', accent: 'from-orange-500 to-red-500', path: '/boarders', state: { section: 'checked-out' } },
    { label: 'Archived', value: String(closedBoarders), change: 'Closed', icon: 'Users', accent: 'from-slate-500 to-slate-400', path: '/boarders', state: { section: 'archived' } },
    { label: 'Total Rooms', value: String(totalRooms), change: `${availableBeds} beds available`, icon: 'Home', accent: 'from-emerald-500 to-teal-500', path: '/rooms' },
    { label: 'Occupied Rooms', value: String(occupiedRooms), change: `${occupancyRate}% occupancy`, icon: 'Home', accent: 'from-amber-500 to-orange-500', path: '/rooms' },
    { label: 'Available Rooms', value: String(totalRooms - occupiedRooms), change: 'Ready', icon: 'Home', accent: 'from-cyan-500 to-blue-500', path: '/rooms' },
    { label: 'Monthly Revenue', value: `৳${monthlyRevenue}`, change: `${activeBoarders} active boarders`, icon: 'CreditCard', accent: 'from-orange-500 to-amber-500', path: '/boarders' },
    { label: 'Total Due', value: `৳${totalPendingDues}`, change: `${boardersWithDues} boarders owed`, icon: 'Wallet', accent: 'from-cyan-500 to-blue-500', path: '/boarders' },
    { label: 'Advance Balance', value: `৳${totalAdvanceBalance}`, change: 'Prepayments', icon: 'CreditCard', accent: 'from-violet-500 to-indigo-500', path: '/payments' },
  ]

  const stats = [
    { title: 'Occupancy Rate', value: `${occupancyRate}%`, trend: `${occupiedRooms} of ${totalRooms} rooms` },
    { title: 'Total Due', value: `৳${totalPendingDues}`, trend: `${boardersWithDues} boarders` },
    { title: 'Monthly Revenue', value: `৳${monthlyRevenue}`, trend: `${activeBoarders} active` },
  ]

  return (
  <div className="space-y-6">
    <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
      <div className="rounded-4xl border border-slate-800/70 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Welcome back</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Operations dashboard</h2>
            <p className="mt-2 max-w-2xl text-slate-400">
              Monitor occupancy, revenue, and boarding analytics across your facility with a unified modern control center.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-1">
            <div className="rounded-3xl bg-slate-900/90 px-4 py-3 text-slate-300 shadow-inner shadow-slate-950/10">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Current period</p>
              <p className="mt-2 text-sm font-semibold text-white">{currentMonthLabel}</p>
            </div>
            <div className="rounded-3xl bg-slate-900/90 px-4 py-3 text-slate-300 shadow-inner shadow-slate-950/10">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Active alerts</p>
              <p className="mt-2 text-sm font-semibold text-emerald-400">{boardersWithDues > 0 ? `${boardersWithDues} boarders with due` : 'All paid up'}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          {metrics.map((metric) => {
            const Icon = iconMap[metric.icon as keyof typeof iconMap]
            return (
              <button
                key={metric.label}
                type="button"
                onClick={() => navigate(metric.path, { state: metric.state })}
                className="rounded-[28px] border border-slate-800/80 bg-slate-900/90 p-5 text-left shadow-lg shadow-slate-950/20 transition hover:border-sky-500/40 hover:bg-slate-800"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-linear-to-br ${metric.accent} text-white shadow-lg shadow-slate-950/30`}>
                  {Icon ? <Icon className="h-5 w-5" /> : null}
                </div>
                <p className="mt-5 text-sm uppercase tracking-[0.32em] text-slate-500">{metric.label}</p>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <p className="text-3xl font-semibold text-white">{metric.value}</p>
                  <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs uppercase tracking-[0.28em] text-emerald-300">
                    {metric.change}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-6 rounded-4xl border border-slate-800/70 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Quick insights</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Boarding performance</h3>
          </div>
          <div className="rounded-3xl bg-slate-900/90 px-4 py-3 text-sm text-slate-300">Live</div>
        </div>

        <div className="grid gap-4">
          {stats.map((stat) => (
            <div key={`${stat.title}-${stat.trend}`} className="rounded-[28px] border border-slate-800/80 bg-slate-900/90 p-5 shadow-sm shadow-slate-950/20">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-400">{stat.title}</p>
                <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs uppercase tracking-[0.28em] text-slate-300">{stat.trend}</span>
              </div>
              <p className="mt-4 text-3xl font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[28px] border border-slate-800/80 bg-slate-900/90 p-5 shadow-sm shadow-slate-950/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">Latest updates</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Payments and occupancy</h3>
            </div>
            {Wallet ? <Wallet className="h-5 w-5 text-slate-300" /> : null}
          </div>
          <div className="mt-6 space-y-3">
            {payments.length === 0 ? (
              <div className="rounded-3xl border border-slate-800/80 bg-slate-950/90 px-4 py-6 text-center text-slate-400">
                No payments have been recorded yet.
              </div>
              ) : (
              payments.slice(-5).reverse().map((payment) => (
                <button key={payment.id} onClick={() => navigate('/payments', { state: { paymentId: payment.id } })} className="w-full text-left">
                  <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-800/80 bg-slate-950/90 px-4 py-4">
                    <div>
                      <p className="font-semibold text-slate-100">{payment.guest}</p>
                      <p className="text-sm text-slate-500">{payment.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-white">৳{payment.amount}</p>
                      <p className="text-sm text-slate-500">{payment.date ? payment.date.slice(0, 7) : 'Pending'}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
        <div className="rounded-[28px] border border-slate-800/80 bg-slate-900/90 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">Recent</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Latest boarders</h3>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {boarders.length === 0 ? (
              <div className="rounded-3xl border border-slate-800/80 bg-slate-950/90 px-4 py-6 text-center text-slate-400">
                No boarders have been added yet.
              </div>
            ) : (
              boarders.slice(-5).reverse().map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-4 rounded-3xl border border-slate-800/80 bg-slate-950/90 px-4 py-4">
                  <div>
                    <p className="font-semibold text-slate-100">{b.name}</p>
                    <p className="text-sm text-slate-500">{b.room}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">{b.checkIn || '-'}</p>
                    <p className="text-xs text-slate-400">{b.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>

    <section className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-4xl border border-slate-800/70 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Occupancy</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Room utilization</h3>
          </div>
          {Layers2 ? <Layers2 className="h-5 w-5 text-slate-400" /> : null}
        </div>
        <div className="mt-6 rounded-3xl border border-slate-800/80 bg-slate-900/90 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Occupied rooms</p>
              <p className="mt-2 text-2xl font-semibold text-white">{occupiedRooms}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Total rooms</p>
              <p className="mt-2 text-2xl font-semibold text-white">{totalRooms}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Occupancy rate</p>
              <p className="mt-2 text-2xl font-semibold text-white">{occupancyRate}%</p>
            </div>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {dashboardRoomsWithOccupancy.map((room) => (
            <div key={room.id} className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-white">{room.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{room.occupied} / {room.capacity} occupants</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  room.status === 'Available'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : room.status === 'Occupied'
                    ? 'bg-rose-500/15 text-rose-300'
                    : 'bg-amber-500/15 text-amber-300'
                }`}>{room.status}</span>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-3 rounded-full ${
                    room.status === 'Available'
                      ? 'bg-emerald-500'
                      : room.status === 'Occupied'
                      ? 'bg-rose-500'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${(room.occupied / room.capacity) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-4xl border border-slate-800/70 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Revenue</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Monthly health</h3>
          </div>
              {ArrowUpRight ? <ArrowUpRight className="h-5 w-5 text-slate-400" /> : null}
        </div>
        <div className="mt-6 space-y-5">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Monthly Revenue</p>
                <p className="mt-2 text-3xl font-semibold text-white">৳{monthlyRevenue}</p>
              </div>
              <span className="rounded-3xl bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-300">{activeBoarders} active</span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
              <div className="h-3 w-full rounded-full bg-linear-to-r from-indigo-500 to-cyan-400" />
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Total Due</p>
                <p className="mt-2 text-2xl font-semibold text-white">৳{totalPendingDues}</p>
              </div>
              <span className="rounded-3xl bg-sky-500/15 px-3 py-2 text-sm font-semibold text-sky-300">{boardersWithDues} boarders</span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
              <div className="h-3 w-5/6 rounded-full bg-linear-to-r from-emerald-500 to-lime-400" />
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Advance Balance</p>
                <p className="mt-2 text-2xl font-semibold text-white">৳{totalAdvanceBalance}</p>
              </div>
              {Wallet ? <Wallet className="h-5 w-5 text-slate-400" /> : null}
            </div>
            <p className="mt-4 text-sm text-slate-400">{totalAdvanceBalance > 0 ? `Prepayments on account` : 'No advance balance'}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
)
}

export default DashboardPage
