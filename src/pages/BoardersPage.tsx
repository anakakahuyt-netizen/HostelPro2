/*
 * ARCHITECTURE LOCK - HostelPro V1.2
 * Stable area: Boarder UI and ledger are locked. Avoid behavioral changes.
 * Permitted: comments, type annotations, and documentation only.
 */

import { useMemo, useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useBoarderStore } from '../store/boarderStore'
import { useRoomStore } from '../store/roomStore'
import { usePaymentStore } from '../store/paymentStore'
import type { NormalizedBoarderStatus } from '../utils/boarderLedger'
import type { Boarder } from '../types'
import { getTodayDate } from '../utils/dateUtils'
import { getBoarderRoomInfo, getBoarderRoomPrice, getBoarderTotals, getDerivedBoarderStatus, normalizeBoarderStatus } from '../utils/boarderLedger'
import formatCurrency from '../utils/formatCurrency'
import { Users, Search, Filter, Plus, Eye, Edit2, Trash2, Mail, Phone, MapPin, UserCheck } from 'lucide-react'
import Modal from '../components/modals/Modal'
import ConfirmModal from '../components/modals/ConfirmModal'
import BoarderForm from '../components/forms/BoarderForm'
import { showToast } from '../services/toast'

const iconMap = {
  Users,
  UserCheck,
}

function formatPaymentId(date: string, roomNumber: string, existingIds: string[]): string {
  const parsed = new Date(date || '')
  const sourceDate = Number.isNaN(parsed.getTime()) ? new Date() : parsed
  const day = String(sourceDate.getDate()).padStart(2, '0')
  const month = String(sourceDate.getMonth() + 1).padStart(2, '0')
  const year = String(sourceDate.getFullYear())
  const normalizedRoom = roomNumber.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'ROOM'
  const baseId = `PAY-${day}${month}${year}${normalizedRoom}`
  let candidate = baseId
  let suffix = 1
  while (existingIds.includes(candidate)) {
    suffix += 1
    candidate = `${baseId}-${suffix}`
  }
  return candidate
}

export default function BoardersPage() {
  const boarders = useBoarderStore((state) => state.boarders)
  const addBoarder = useBoarderStore((s) => s.addBoarder)
  const updateBoarder = useBoarderStore((s) => s.updateBoarder)
  const removeBoarder = useBoarderStore((s) => s.removeBoarder)
  const rooms = useRoomStore((s) => s.rooms)
  const payments = usePaymentStore((s) => s.payments)
  const addPayment = usePaymentStore((s) => s.addPayment)

  const [query, setQuery] = useState('')
  const [roomFilter, setRoomFilter] = useState('')
  const [openAdd, setOpenAdd] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string; message?: string } | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [tab, setTab] = useState<'active'|'booked'|'checked-out'|'archived'>('active')

  const location = useLocation()
  const activeSectionRef = useRef<HTMLDivElement | null>(null)
  const bookedSectionRef = useRef<HTMLDivElement | null>(null)
  const checkedOutSectionRef = useRef<HTMLDivElement | null>(null)

  const statusStyles: Record<NormalizedBoarderStatus, string> = {
    ACTIVE: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    BOOKED: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    CHECKED_OUT: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
    CLOSED: 'bg-slate-700/15 text-slate-400 border border-slate-700/30',
  }

  const matchesSearch = (boarder: typeof boarders[number]) => {
    const q = query.trim().toLowerCase()
    if (roomFilter) {
      const roomInfo = getBoarderRoomInfo(boarder, rooms)
      const roomMatch = boarder.room === roomFilter || roomInfo.roomNumber === roomFilter
      if (!roomMatch) return false
    }
    return (
      boarder.name?.toLowerCase().includes(q) ||
      boarder.phone?.toLowerCase().includes(q) ||
      boarder.email?.toLowerCase().includes(q) ||
      boarder.id?.toLowerCase().includes(q) ||
      String(boarder.room || '').toLowerCase().includes(q)
    )
  }

  const dueMap = useMemo(() => {
    const map: Record<string, number> = {}
    boarders.forEach((b) => {
      const room = rooms.find((r) => r.id === b.room || r.roomNumber === b.room)
      const paymentsFor = payments.filter((p) => p.boarderId === b.id)
      const normalized = normalizeBoarderStatus(b.status)
      const effectiveStatus = normalized === 'CHECKED_OUT' ? 'CHECKED_OUT' : getDerivedBoarderStatus(b, 0)
      const { totalDue } = getBoarderTotals(b, paymentsFor, room, effectiveStatus)
      map[b.id] = totalDue
    })
    return map
  }, [boarders, rooms, payments])

  const derivedStatusMap = useMemo(() => {
    const map: Record<string, NormalizedBoarderStatus> = {}
    boarders.forEach((b) => {
      map[b.id] = getDerivedBoarderStatus(b, dueMap[b.id] ?? 0)
    })
    return map
  }, [boarders, dueMap])

  const getDerivedStatus = (boarder: typeof boarders[number]): NormalizedBoarderStatus => derivedStatusMap[boarder.id] || normalizeBoarderStatus(boarder.status)

  const activeBoarderList = useMemo(() => boarders.filter((b) => getDerivedStatus(b) === 'ACTIVE' && matchesSearch(b)), [boarders, rooms, query, roomFilter, derivedStatusMap])
  const bookedBoarderList = useMemo(() => boarders.filter((b) => getDerivedStatus(b) === 'BOOKED' && matchesSearch(b)), [boarders, rooms, query, roomFilter, derivedStatusMap])
  const checkedOutBoarderList = useMemo(() => boarders.filter((b) => getDerivedStatus(b) === 'CHECKED_OUT' && matchesSearch(b)), [boarders, rooms, query, roomFilter, derivedStatusMap])
  const archivedBoarderList = useMemo(() => boarders.filter((b) => getDerivedStatus(b) === 'CLOSED' && matchesSearch(b)), [boarders, rooms, query, roomFilter, derivedStatusMap])

  const totalRent = useMemo(() => {
    return activeBoarderList.reduce((sum, boarder) => {
      const room = rooms.find((r) => r.id === boarder.room || r.roomNumber === boarder.room)
      return sum + (room?.price || 0)
    }, 0)
  }, [activeBoarderList, rooms])

  const activeBoarders = activeBoarderList.length
  const bookedBoarders = bookedBoarderList.length
  const checkedOutBoarders = checkedOutBoarderList.length
  const closedBoarders = archivedBoarderList.length
  const totalBoarders = activeBoarders + bookedBoarders + checkedOutBoarders + closedBoarders

  const boarderStats = [
    { label: 'Total Boarders', value: String(totalBoarders), change: `${activeBoarders} active`, icon: 'Users', accent: 'from-indigo-500 to-sky-500', tab: 'active' },
    { label: 'Active', value: String(activeBoarders), change: `${bookedBoarders} booked`, icon: 'UserCheck', accent: 'from-emerald-500 to-teal-500', tab: 'active' },
    { label: 'Booked', value: String(bookedBoarders), change: `${checkedOutBoarders} checked out`, icon: 'Users', accent: 'from-cyan-500 to-blue-500', tab: 'booked' },
    { label: 'Checked-out', value: String(checkedOutBoarders), change: `${closedBoarders} closed`, icon: 'Users', accent: 'from-orange-500 to-red-500', tab: 'checked-out' },
    { label: 'Archived', value: String(closedBoarders), change: 'Closed', icon: 'Users', accent: 'from-slate-500 to-slate-400', tab: 'archived' },
  ]

  const occupiedBeds = activeBoarderList.length
  const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0)
  const averageStayMonths = useMemo(() => {
    const now = new Date()
    const stays = boarders
      .map((boarder) => {
        if (!boarder.checkIn) return null
        const start = new Date(boarder.checkIn)
        const end = boarder.checkOut ? new Date(boarder.checkOut) : now
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
        return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
      })
      .filter((value): value is number => value !== null)
    if (!stays.length) return 0
    return stays.reduce((sum, m) => sum + m, 0) / stays.length
  }, [boarders])
  const boarderOccupancyRate = totalCapacity ? Math.round((occupiedBeds / totalCapacity) * 100) : 0
  const averageStayLabel = `${averageStayMonths ? averageStayMonths.toFixed(1) : '0.0'} months`
  const occupancyLabel = `${boarderOccupancyRate}%`
  const occupiedRoomCount = rooms.filter((room) => activeBoarderList.some((b) => b.room === room.id || b.room === room.roomNumber)).length

  useEffect(() => {
    const section = (location.state as { section?: string })?.section
    if (section === 'booked' && bookedSectionRef.current) {
      bookedSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setTab('booked')
    } else if (section === 'checked-out' && checkedOutSectionRef.current) {
      checkedOutSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setTab('checked-out')
    } else if (section === 'active' && activeSectionRef.current) {
      activeSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setTab('active')
    }
  }, [location.state])

  useEffect(() => {
    setPage(1)
  }, [tab, query, roomFilter])

  const currentView = boarders.find((b) => b.id === viewing)
  const viewRoom = currentView ? rooms.find((r) => r.id === currentView.room || r.roomNumber === currentView.room) : undefined

  useEffect(() => {
    try {
      const statusCounts = boarders.reduce<Record<string, number>>((acc, boarder) => {
        const status = boarder.status || 'UNKNOWN'
        acc[status] = (acc[status] ?? 0) + 1
        return acc
      }, {})
      console.debug('[BoardersPage] boarders ->', boarders.length, boarders.slice(0, 3), statusCounts)
    } catch (err) {
      console.error('[BoardersPage] debug failed', err)
    }
  }, [boarders])

  const currentListLength = tab === 'active'
    ? activeBoarderList.length
    : tab === 'booked'
      ? bookedBoarderList.length
      : tab === 'checked-out'
        ? checkedOutBoarderList.length
        : archivedBoarderList.length

  const activePageCount = Math.max(1, Math.ceil(activeBoarderList.length / pageSize))
  const bookedPageCount = Math.max(1, Math.ceil(bookedBoarderList.length / pageSize))
  const checkedOutPageCount = Math.max(1, Math.ceil(checkedOutBoarderList.length / pageSize))
  const archivedPageCount = Math.max(1, Math.ceil(archivedBoarderList.length / pageSize))

  const currentPageCount = tab === 'active'
    ? activePageCount
    : tab === 'booked'
      ? bookedPageCount
      : tab === 'checked-out'
        ? checkedOutPageCount
        : archivedPageCount

  useEffect(() => {
    if (page > currentPageCount) {
      setPage(currentPageCount)
    }
  }, [currentPageCount, page])

  const paginatedActiveBoarderList = activeBoarderList.slice((page - 1) * pageSize, page * pageSize)
  const paginatedBookedBoarderList = bookedBoarderList.slice((page - 1) * pageSize, page * pageSize)
  const paginatedCheckedOutBoarderList = checkedOutBoarderList.slice((page - 1) * pageSize, page * pageSize)
  const paginatedArchivedBoarderList = archivedBoarderList.slice((page - 1) * pageSize, page * pageSize)

  const currentEditingBoarder = boarders.find((b) => b.id === editing)
  const handleEditSubmit = (b: Boarder, _currentPayment?: number) => {
    updateBoarder(b.id, b)
    setEditing(null)
  }

  return (
    <div className="space-y-8">
      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Resident Management</p>
            <h1 className="mt-2 text-4xl font-bold text-white">Boarders</h1>
            <p className="mt-3 text-slate-400">Manage your hostel residents and track their information</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setOpenAdd(true)} className="inline-flex items-center gap-2 rounded-3xl bg-linear-to-r from-indigo-500 to-sky-500 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-lg hover:shadow-indigo-500/50">
              <Plus className="h-5 w-5" />
              Add Boarder
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {boarderStats.map((stat) => {
            const Icon = iconMap[stat.icon as keyof typeof iconMap]
            return (
              <button key={stat.label} onClick={() => setTab(stat.tab as typeof tab)} className="rounded-[28px] border border-slate-800/80 bg-slate-900/90 p-5 text-left shadow-lg shadow-slate-950/20 transition hover:border-slate-700">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-linear-to-br ${stat.accent} text-white shadow-lg shadow-slate-950/30`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-sm uppercase tracking-[0.32em] text-slate-500">{stat.label}</p>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <p className="text-2xl font-semibold text-white">{stat.value}</p>
                  <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs uppercase tracking-[0.28em] text-emerald-300">
                    {stat.change}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-12 pr-4 text-slate-100 placeholder-slate-500 transition focus:border-sky-500 focus:outline-none"
            />
          </div>
          <select value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4 text-slate-100">
            <option value="">All rooms</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.roomNumber}</option>
            ))}
          </select>
          <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-medium text-slate-300 transition hover:bg-slate-800">
            <Filter className="h-5 w-5" />
            Filters
          </button>
        </div>
      </section>

      <div className="flex items-center gap-2">
        <button onClick={() => setTab('active')} className={`rounded-2xl px-4 py-2 ${tab==='active' ? 'bg-slate-800 text-white' : 'bg-slate-950 text-slate-300'}`}>Active</button>
        <button onClick={() => setTab('booked')} className={`rounded-2xl px-4 py-2 ${tab==='booked' ? 'bg-slate-800 text-white' : 'bg-slate-950 text-slate-300'}`}>Booked</button>
        <button onClick={() => setTab('checked-out')} className={`rounded-2xl px-4 py-2 ${tab==='checked-out' ? 'bg-slate-800 text-white' : 'bg-slate-950 text-slate-300'}`}>Checked-out</button>
        <button onClick={() => setTab('archived')} className={`rounded-2xl px-4 py-2 ${tab==='archived' ? 'bg-slate-800 text-white' : 'bg-slate-950 text-slate-300'}`}>Archived</button>
      </div>

      {tab === 'active' && (
      <section ref={activeSectionRef} className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
          <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Resident List</h2>
          <span className="rounded-full bg-slate-800/80 px-3 py-1 text-sm font-medium text-slate-300">{totalBoarders} total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">ID</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Name</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Contact</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Room</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Check-in</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Status</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Monthly Rent</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {paginatedActiveBoarderList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-400">No boarders found.</td>
                </tr>
              ) : paginatedActiveBoarderList.map((boarder) => {
                const roomInfo = getBoarderRoomInfo(boarder, rooms)
                const monthly = getBoarderRoomPrice(boarder, rooms.find((r) => r.id === boarder.room || r.roomNumber === boarder.room)) || (roomInfo.price ?? 0)
                return (
                  <tr key={boarder.id} className="transition hover:bg-slate-800/40">
                    <td className="px-4 py-4">
                      <span className="font-mono text-sm font-semibold text-indigo-400">{boarder.name.split(' ')[0]}-{roomInfo.roomNumber}</span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-white">{boarder.name}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1 text-xs text-slate-400">
                        <p className="flex items-center gap-2"><Mail className="h-3 w-3" />{boarder.email}</p>
                        <p className="flex items-center gap-2"><Phone className="h-3 w-3" />{boarder.phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-full bg-slate-800/50 px-3 py-1 text-sm text-slate-300"><MapPin className="h-3 w-3 mr-1" />{roomInfo.roomNumber || boarder.room}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-400">{boarder.checkIn}</td>
                    <td className="px-4 py-4">
                      {(() => {
                        const derivedStatus = getDerivedStatus(boarder)
                        return (
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[derivedStatus]}`}>
                            {derivedStatus}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-emerald-400">৳{monthly}</p>
                      <p className="text-sm text-slate-400">Due: ৳{dueMap[boarder.id] ?? 0}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewing(boarder.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-sky-400">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditing(boarder.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-amber-400">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => {
                          const due = dueMap[boarder.id] ?? 0
                          if (due > 0) setConfirmDelete({ id: boarder.id, name: boarder.name, message: 'This boarder has unpaid dues. Are you sure?' })
                          else setConfirmDelete({ id: boarder.id, name: boarder.name })
                        }} className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-rose-400">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-slate-800/50 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">Showing {activeBoarderList.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, activeBoarderList.length)} of {activeBoarderList.length} results</p>
            {activePageCount > 1 ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300">Page {page} of {activePageCount}</span>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(activePageCount, page + 1))}
                  disabled={page === activePageCount}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
      </section>
      )}

      {tab === 'booked' && (
      <section ref={bookedSectionRef} className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Booking List</h2>
          <span className="rounded-full bg-slate-800/80 px-3 py-1 text-sm font-medium text-slate-300">{bookedBoarderList.length} booked</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Name</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Room</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Check-in</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Status</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {paginatedBookedBoarderList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-400">No bookings found.</td>
                </tr>
              ) : paginatedBookedBoarderList.map((boarder) => {
                const roomInfo = getBoarderRoomInfo(boarder, rooms)
                return (
                  <tr key={boarder.id} className="transition hover:bg-slate-800/40">
                    <td className="px-4 py-4"><p className="font-medium text-white">{boarder.name}</p></td>
                    <td className="px-4 py-4"><span className="inline-flex items-center rounded-full bg-slate-800/50 px-3 py-1 text-sm text-slate-300">{roomInfo.roomNumber}</span></td>
                    <td className="px-4 py-4 text-sm text-slate-400">{boarder.checkIn || 'N/A'}</td>
                    <td className="px-4 py-4">{(() => {
                      const derivedStatus = getDerivedStatus(boarder)
                      return (
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[derivedStatus]}`}>
                          {derivedStatus}
                        </span>
                      )
                    })()}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewing(boarder.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-sky-400">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditing(boarder.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-amber-400">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => setConfirmDelete({ id: boarder.id, name: boarder.name })} className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-rose-400">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {tab === 'checked-out' && (
      <section ref={checkedOutSectionRef} className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Checked-out Boarders</h2>
          <span className="rounded-full bg-slate-800/80 px-3 py-1 text-sm font-medium text-slate-300">{checkedOutBoarderList.length} checked-out</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Name</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Room</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Check-in</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Check-out</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Due</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {paginatedCheckedOutBoarderList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-400">No checked-out boarders.</td>
                </tr>
              ) : paginatedCheckedOutBoarderList.map((boarder) => {
                const roomInfo = getBoarderRoomInfo(boarder, rooms)
                return (
                  <tr key={boarder.id} className="transition hover:bg-slate-800/40">
                    <td className="px-4 py-4"><p className="font-medium text-white">{boarder.name}</p></td>
                    <td className="px-4 py-4"><span className="inline-flex items-center rounded-full bg-slate-800/50 px-3 py-1 text-sm text-slate-300">{roomInfo.roomNumber}</span></td>
                    <td className="px-4 py-4 text-sm text-slate-400">{boarder.checkIn || 'N/A'}</td>
                    <td className="px-4 py-4 text-sm text-slate-400">{boarder.checkOut || 'N/A'}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-rose-300">৳{dueMap[boarder.id] ?? 0}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewing(boarder.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-sky-400">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditing(boarder.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-amber-400">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => setConfirmDelete({ id: boarder.id, name: boarder.name })} className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-rose-400">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {tab === 'archived' && (
      <section className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Archived Boarders</h2>
          <span className="rounded-full bg-slate-800/80 px-3 py-1 text-sm font-medium text-slate-300">{closedBoarders} archived</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Name</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Room</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Status</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {paginatedArchivedBoarderList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-400">No archived boarders.</td>
                </tr>
              ) : paginatedArchivedBoarderList.map((boarder) => {
                const roomInfo = getBoarderRoomInfo(boarder, rooms)
                return (
                  <tr key={boarder.id} className="transition hover:bg-slate-800/40">
                    <td className="px-4 py-4"><p className="font-medium text-white">{boarder.name}</p></td>
                    <td className="px-4 py-4"><span className="inline-flex items-center rounded-full bg-slate-800/50 px-3 py-1 text-sm text-slate-300">{roomInfo.roomNumber}</span></td>
                    <td className="px-4 py-4">{(() => {
                      const derivedStatus = getDerivedStatus(boarder)
                      return (
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[derivedStatus]}`}>
                          {derivedStatus}
                        </span>
                      )
                    })()}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => useBoarderStore.getState().restoreBoarder(boarder.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-emerald-400">
                          Restore
                        </button>
                        <button onClick={() => setConfirmDelete({ id: boarder.id, name: boarder.name })} className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-rose-400">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
      )}

      <Modal open={openAdd} onClose={() => setOpenAdd(false)}>
        <h3 className="text-lg font-semibold text-white">Add Boarder</h3>
        <div className="mt-4">
          <BoarderForm onSubmit={(b, currentPayment = 0) => {
            const boarder = b
            addBoarder(boarder)
            showToast('Boarder added')
            const today = getTodayDate()
            const existingIds = payments.map((p) => p.id)

            if (b.status === 'ACTIVE' && currentPayment > 0) {
              const paymentId = formatPaymentId(today, roomNumber, existingIds)
              const monthlyRent = Number(b.monthlyRent || room?.price || 0)
              const openingDue = Number(b.openingDue || 0)
              const totalCharges = monthlyRent + openingDue
              const paymentStatus = currentPayment >= totalCharges ? 'Paid' : 'Partial'

              addPayment({
                id: paymentId,
                boarderId: boarder.id,
                guest: boarder.name,
                room: roomNumber,
                amount: currentPayment,
                date: today,
                dueDate: '',
                status: paymentStatus,
                method: 'Cash',
                notes: 'Initial payment',
              })
            }

            if (b.status === 'BOOKED') {
              const advanceAmount = Number(b.advanceBalance || 0)
              if (advanceAmount > 0) {
                const paymentId = formatPaymentId(today, roomNumber, existingIds)
                addPayment({
                  id: paymentId,
                  boarderId: boarder.id,
                  guest: boarder.name,
                  room: roomNumber,
                  amount: advanceAmount,
                  date: today,
                  dueDate: '',
                  status: 'Advance',
                  method: 'Advance Payment',
                  notes: 'Advance payment for activation',
                })
              }
            }

            setOpenAdd(false)
          }} />
        </div>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)}>
        <h3 className="text-lg font-semibold text-white">Edit Boarder</h3>
        <div className="mt-4">
          <BoarderForm initial={currentEditingBoarder} onSubmit={handleEditSubmit} />
        </div>
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)}>
        <h3 className="text-lg font-semibold text-white">Boarder Details</h3>
        {currentView && (
          <div className="mt-4 grid gap-2">
            <p><strong>Name:</strong> {currentView.name}</p>
            <p><strong>Phone:</strong> {currentView.phone}</p>
            <p><strong>Email:</strong> {currentView.email}</p>
            <p><strong>Room:</strong> {viewRoom ? viewRoom.roomNumber : currentView.room}</p>
            <p><strong>Monthly rent:</strong> ৳{getBoarderRoomPrice(currentView, viewRoom)}</p>
            <p><strong>Check-in date:</strong> {currentView.checkIn}</p>
            <p><strong>Check-out date:</strong> {currentView.checkOut || 'N/A'}</p>
            <p><strong>Status:</strong> {getDerivedStatus(currentView)}</p>
            <p><strong>Total due:</strong> ৳{dueMap[currentView.id] ?? 0}</p>
            <p><strong>Payment history:</strong></p>
            <div className="text-sm text-slate-400">
              {payments.filter((p) => p.boarderId === currentView.id).map((payment) => (
                <div key={payment.id} className="flex justify-between gap-4">
                  <span>{payment.date || payment.dueDate || 'N/A'}</span>
                  <span>৳{payment.amount}</span>
                </div>
              ))}
            </div>
            {currentView.roomHistory && currentView.roomHistory.length > 0 && (
              <>
                <p><strong>Room history:</strong></p>
                <ul className="ml-4 list-disc text-sm text-slate-400">
                  {currentView.roomHistory.map((entry, idx) => (
                    <li key={idx}>{typeof entry === 'string' ? entry : `${entry.roomNumber} (${formatCurrency(entry.price)})`}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!confirmDelete} title="Delete boarder" message={confirmDelete?.message ?? 'Are you sure?'} onConfirm={() => { if (confirmDelete) { removeBoarder(confirmDelete.id); setConfirmDelete(null); showToast('Delete completed') } }} onCancel={() => setConfirmDelete(null)} />

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
          <h3 className="text-lg font-semibold text-white">Average Stay Duration</h3>
          <p className="mt-4 text-4xl font-bold text-indigo-400">{averageStayLabel}</p>
          <p className="mt-2 text-sm text-slate-400">Based on {boarders.length} boarders</p>
        </div>

        <div className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
          <h3 className="text-lg font-semibold text-white">Occupancy Rate</h3>
          <p className="mt-4 text-4xl font-bold text-emerald-400">{occupancyLabel}</p>
          <p className="mt-2 text-sm text-slate-400">{occupiedRoomCount} of {rooms.length} rooms occupied</p>
        </div>

        <div className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
          <h3 className="text-lg font-semibold text-white">Total Monthly Rent</h3>
          <p className="mt-4 text-4xl font-bold text-emerald-400">৳{totalRent}</p>
          <p className="mt-2 text-sm text-slate-400">Projected recurring rent this month</p>
        </div>
      </section>
    </div>
  )
}
