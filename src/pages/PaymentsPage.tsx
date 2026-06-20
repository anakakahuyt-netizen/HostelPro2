import { useState, useMemo, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, Filter, Download, Plus, Eye, Edit2, Trash2, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { usePaymentStore } from '../store/paymentStore'
import { useBoarderStore } from '../store/boarderStore'
import { useRoomStore } from '../store/roomStore'
import type { Payment } from '../types'
import { getBoarderRoomInfo, getBoarderTotals, isArchivedBoarder, normalizeBoarderStatus, getDerivedBoarderStatus } from '../utils/boarderLedger'
import formatCurrency from '../utils/formatCurrency'
import Modal from '../components/modals/Modal'
import ConfirmModal from '../components/modals/ConfirmModal'
import PaymentForm from '../components/forms/PaymentForm'

const iconMap = {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
}

export default function PaymentsPage() {
  const statusStyles = {
    Paid: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    Pending: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    Overdue: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    Partial: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    Due: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    Advance: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
  }
 
  const payments = usePaymentStore((s) => s.payments)
  const addPayment = usePaymentStore((s) => s.addPayment)
  const updatePayment = usePaymentStore((s) => s.updatePayment)
  const removePayment = usePaymentStore((s) => s.removePayment)
  const boarders = useBoarderStore((s) => s.boarders)
  const rooms = useRoomStore((s) => s.rooms)

  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()
  const [filterBoarder, setFilterBoarder] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [editingPayment, setEditingPayment] = useState<string | null>(null)
  const [viewingPayment, setViewingPayment] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [preselectedBoarder, setPreselectedBoarder] = useState<string | null>(null)
  const [paymentPage, setPaymentPage] = useState(1)

  const dueMap = useMemo(() => {
    const map: Record<string, number> = {}
    boarders.forEach((boarder) => {
      const room = rooms.find((r) => r.id === boarder.room || r.roomNumber === boarder.room)
      const paymentsFor = payments.filter((p) => p.boarderId === boarder.id)
      const normalized = normalizeBoarderStatus(boarder.status)
      const effectiveStatus = normalized === 'CHECKED_OUT' ? 'CHECKED_OUT' : getDerivedBoarderStatus(boarder, 0)
      const { totalDue } = getBoarderTotals(boarder, paymentsFor, room, effectiveStatus)
      map[boarder.id] = totalDue
    })
    return map
  }, [boarders, rooms, payments])

  const totalCollected = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments])
  const totalPendingDues = useMemo(() => Object.values(dueMap).reduce((s, v) => s + v, 0), [dueMap])
  const pendingCount = useMemo(() => Object.values(dueMap).filter((v) => v > 0).length, [dueMap])

  // Boarder/room resolution now handled in aggregated records/modals

  const computePaymentStatus = (payment: Payment) => {
    const boarder = boarders.find((b) => b.id === payment.boarderId)
    if (!boarder) {
      // fallback to simple heuristic when no boarder found
      const amount = Number(payment.amount || 0)
      return amount === 0 ? 'Due' : 'Paid'
    }

    const room = rooms.find((r) => r.id === boarder.room || r.roomNumber === boarder.room)
    const paymentsFor = payments.filter((p) => p.boarderId === boarder.id)

    // First compute initial totals to allow derived status resolution
    const initialTotals = getBoarderTotals(boarder, paymentsFor, room)
    const derived = getDerivedBoarderStatus(boarder, initialTotals.totalDue)
    const { ledger, totalDue, advance } = getBoarderTotals(boarder, paymentsFor, room, derived)

    // Determine month for this payment (prefer payment.date then dueDate)
    const month = (payment.date || payment.dueDate || '').slice(0, 7)
    const entry = ledger.find((e) => e.month === month)

    if (entry) {
      // BOOKED months have rent === 0; payments count as advance
      if (entry.rent === 0) {
        return entry.advance > 0 ? 'Advance' : 'Paid'
      }
      if (entry.due === 0) return 'Paid'
      if (entry.paid > 0 && entry.due > 0) return 'Partial'
      if (entry.paid === 0 && entry.due > 0) return 'Due'
      return 'Due'
    }

    // If no ledger entry for the month, classify based on overall totals
    if (totalDue <= 0) {
      return advance > 0 ? 'Advance' : 'Paid'
    }
    return 'Due'
  }

  const paidCount = useMemo(() => payments.filter((p) => computePaymentStatus(p) === 'Paid').length, [payments, boarders, rooms])
  const successRate = useMemo(() => (payments.length ? Math.round((paidCount / payments.length) * 100) : 0), [payments, paidCount])
  const successChangeLabel = payments.length ? `${paidCount} paid` : 'No payments'

  const overdueAmount = useMemo(() => {
    const now = new Date()
    return payments
      .filter((p) => {
        const status = computePaymentStatus(p)
        if (status !== 'Due') return false
        if (!p.dueDate) return true
        const due = new Date(p.dueDate)
        return due < now
      })
      .reduce((s, p) => s + p.amount, 0)
  }, [payments, boarders, rooms])

  const paymentMethods = useMemo(() => {
    const totals: Record<string, number> = {
      'Card Payments': 0,
      'Bank Transfer': 0,
      Check: 0,
    }
    payments.forEach((payment) => {
      if (payment.method === 'Card') totals['Card Payments'] += payment.amount
      else if (payment.method === 'Transfer') totals['Bank Transfer'] += payment.amount
      else if (payment.method === 'Check') totals['Check'] += payment.amount
    })
    const totalAmount = totals['Card Payments'] + totals['Bank Transfer'] + totals['Check']
    return [
      { method: 'Card Payments', amount: totals['Card Payments'], percentage: totalAmount ? Math.round((totals['Card Payments'] / totalAmount) * 100) : 0 },
      { method: 'Bank Transfer', amount: totals['Bank Transfer'], percentage: totalAmount ? Math.round((totals['Bank Transfer'] / totalAmount) * 100) : 0 },
      { method: 'Check', amount: totals['Check'], percentage: totalAmount ? Math.round((totals['Check'] / totalAmount) * 100) : 0 },
    ]
  }, [payments])

  useEffect(() => {
    const status = (location.state as { status?: string })?.status
    if (status === 'Due') {
      setFilterStatus('Due')
    }
  }, [location.state])

  useEffect(() => {
    const state = location.state as any
    if (state?.paymentId) {
      setViewingPayment(state.paymentId)
    }
    if (state?.month) {
      setFilterMonth(state.month)
    }
  }, [location.state])

  const paymentStats = [
    { label: 'Total Collected', value: formatCurrency(totalCollected), change: '', icon: 'TrendingUp', accent: 'from-emerald-500 to-teal-500' },
    { label: 'Pending Dues', value: formatCurrency(totalPendingDues), change: `${pendingCount} owed`, icon: 'AlertCircle', accent: 'from-amber-500 to-orange-500' },
    { label: 'Overdue', value: formatCurrency(overdueAmount), change: `${payments.filter((p) => computePaymentStatus(p) === 'Due' && (!p.dueDate || new Date(p.dueDate) < new Date())).length} overdue`, icon: 'AlertCircle', accent: 'from-rose-500 to-pink-500' },
    { label: 'Success Rate', value: `${successRate}%`, change: successChangeLabel, icon: 'CheckCircle2', accent: 'from-blue-500 to-cyan-500' },
  ]


  const paymentRecords = useMemo(() => {
    if (!Array.isArray(payments)) return []
    return payments
      .map((payment) => {
        const boarder = boarders.find((b) => b.id === payment.boarderId)
        const room = rooms.find((r) => r.id === boarder?.room || r.roomNumber === boarder?.room)
        const roomInfo = boarder ? getBoarderRoomInfo(boarder, rooms) : { roomNumber: payment.room, price: 0 }
        const paymentsFor = boarder ? payments.filter((p) => p.boarderId === boarder.id) : [payment]
        const { totalDue } = boarder ? getBoarderTotals(boarder, paymentsFor, room) : { totalDue: 0 }
        const derivedStatus = boarder ? getDerivedBoarderStatus(boarder, totalDue) : 'ACTIVE'
        const shouldInclude = !boarder || !isArchivedBoarder(boarder, totalDue)
        return {
          id: payment.id,
          payment,
          boarderName: boarder?.name || payment.guest || 'Unknown',
          roomNumber: roomInfo.roomNumber || payment.room || 'Unknown',
          status: payment.status || 'Due',
          boarderStatus: derivedStatus,
          totalDue,
          amount: payment.amount ?? 0,
          method: payment.method || 'Cash',
          date: payment.date,
          dueDate: payment.dueDate,
          boarderId: payment.boarderId,
          shouldInclude,
        }
      })
      .filter((rec) => rec.shouldInclude)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [payments, boarders, rooms])

  const filteredPayments = useMemo(() => {
    return paymentRecords.filter((rec) => {
      const q = searchQuery.trim().toLowerCase()
      if (searchQuery && !(`${rec.boarderName}`.toLowerCase().includes(q) || rec.roomNumber.toLowerCase().includes(q) || rec.id.toLowerCase().includes(q))) return false
      if (filterBoarder && rec.boarderId !== filterBoarder) return false
      if (filterMonth && !(rec.date?.slice(0, 7) === filterMonth)) return false
      if (filterStatus && rec.status !== filterStatus) return false
      return true
    })
  }, [paymentRecords, searchQuery, filterBoarder, filterMonth, filterStatus])

  const currentPayment = payments.find((p) => p.id === editingPayment)

  const handleSavePayment = (payment: Payment) => {
    if (editingPayment) {
      updatePayment(editingPayment, payment)
      setEditingPayment(null)
    } else {
      addPayment(payment)
    }
    setShowModal(false)
  }

  const paymentPageSize = 10
  const paymentPageCount = Math.max(1, Math.ceil(filteredPayments.length / paymentPageSize))
  const paymentPageItems = filteredPayments.slice((paymentPage - 1) * paymentPageSize, paymentPage * paymentPageSize)

  useEffect(() => {
    if (paymentPage > paymentPageCount) {
      setPaymentPage(paymentPageCount)
    }
  }, [paymentPageCount, paymentPage])

  return (
    <div className="space-y-8">
      {/* Header section */}
      <section className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Financial</p>
            <h1 className="mt-2 text-4xl font-bold text-white">Payment Management</h1>
            <p className="mt-3 text-slate-400">Track and manage all hostel payments efficiently</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setEditingPayment(null); setShowModal(true) }} className="inline-flex items-center gap-2 rounded-3xl bg-linear-to-r from-sky-500 to-indigo-500 px-6 py-3 font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:shadow-lg hover:bg-sky-500/50">
              <Plus className="h-5 w-5" />
              New Payment
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {paymentStats.map((stat) => {
            const Icon = iconMap[stat.icon as keyof typeof iconMap]
            const onClick = () => {
              if (stat.label === 'Pending Dues' || stat.label === 'Overdue') setFilterStatus('Due')
              else setFilterStatus('')
            }
            return (
              <button key={stat.label} onClick={onClick} className="rounded-[28px] border border-slate-800/80 bg-slate-900/90 p-5 text-left shadow-lg shadow-slate-950/20">
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


      {/* Search and filters */}
      <section className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by boarder name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-12 pr-4 text-slate-100 placeholder-slate-500 transition focus:border-sky-500 focus:outline-none"
            />
          </div>
          <select value={filterBoarder} onChange={(e) => setFilterBoarder(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4 text-slate-100">
            <option value="">All boarders</option>
            {boarders.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4 text-slate-100" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4 text-slate-100">
            <option value="">All statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Due">Due</option>
          </select>
          <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-medium text-slate-300 transition hover:bg-slate-800">
            <Filter className="h-5 w-5" />
            Filters
          </button>
          <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-medium text-slate-300 transition hover:bg-slate-800">
            <Download className="h-5 w-5" />
            Export
          </button>
        </div>
      </section>

      {/* Payments table */}
      <section className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
            <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Payment Records</h2>
          <span className="rounded-full bg-slate-800/80 px-3 py-1 text-sm font-medium text-slate-300">{boarders.length} boarders</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Payment ID</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Guest</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Room</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Amount</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Payment Date</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Status</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Method</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {paymentPageItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-400">No payments found.</td>
              </tr>
            ) : paymentPageItems.map((rec) => (
                <tr key={rec.id} className="transition hover:bg-slate-800/40">
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm font-semibold text-sky-400">{rec.id}</span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-white">{rec.boarderName}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center rounded-full bg-slate-800/50 px-3 py-1 text-sm text-slate-300">{rec.roomNumber}</span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-emerald-400">{formatCurrency(rec.amount)}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-400">{rec.date ?? '-'}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[rec.status as keyof typeof statusStyles]}`}>
                      {rec.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-400">{rec.method}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setViewingPayment(rec.id); setShowModal(false) }} className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-sky-400">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setEditingPayment(rec.id); setPreselectedBoarder(rec.boarderId); setShowModal(true) }} className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-amber-400">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => setConfirmDelete(rec.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-rose-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex flex-col gap-3 border-t border-slate-800/50 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">Showing {filteredPayments.length === 0 ? 0 : (paymentPage - 1) * paymentPageSize + 1} to {Math.min(paymentPage * paymentPageSize, filteredPayments.length)} of {filteredPayments.length} results</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPaymentPage(Math.max(1, paymentPage - 1))}
              disabled={paymentPage === 1}
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300">Page {paymentPage} of {paymentPageCount}</span>
            <button
              type="button"
              onClick={() => setPaymentPage(Math.min(paymentPageCount, paymentPage + 1))}
              disabled={paymentPage === paymentPageCount}
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditingPayment(null); setPreselectedBoarder(null) }}>
        <h3 className="text-lg font-semibold text-white">{editingPayment ? 'Edit Payment' : 'New Payment'}</h3>
        <div className="mt-4">
          <PaymentForm
            boarders={boarders}
            rooms={rooms}
            payments={payments}
            initial={currentPayment ?? (preselectedBoarder ? ({ boarderId: preselectedBoarder } as Partial<Payment>) : undefined)}
            onSubmit={handleSavePayment}
          />
        </div>
      </Modal>
      <Modal open={!!viewingPayment} onClose={() => setViewingPayment(null)}>
        <h3 className="text-lg font-semibold text-white">Payment Details</h3>
        {(() => {
          if (!viewingPayment) return null
          if (viewingPayment.startsWith('boarder:')) {
            const id = viewingPayment.split(':')[1]
            const boarder = boarders.find((b) => b.id === id)
            if (!boarder) return null
            const room = rooms.find((r) => r.id === boarder.room || r.roomNumber === boarder.room)
            const roomInfo = getBoarderRoomInfo(boarder, rooms)
            const paymentsFor = payments.filter((p) => p.boarderId === boarder.id)
            const { totalPaid, totalDue, advance, ledger } = getBoarderTotals(boarder, paymentsFor, room)
            return (
              <div className="mt-4 space-y-3 text-sm text-slate-200">
                <p><strong>Boarder name:</strong> {boarder.name}</p>
                <p><strong>Room:</strong> {roomInfo.roomNumber || 'Unknown'}</p>
                <p><strong>Room rent:</strong> {formatCurrency(roomInfo.price || 0)}</p>
                <p><strong>Total paid:</strong> {formatCurrency(totalPaid)}</p>
                <p><strong>Total due:</strong> {formatCurrency(totalDue)}</p>
                <p><strong>Advance balance:</strong> {formatCurrency(advance)}</p>
                <p><strong>Payment ledger:</strong></p>
                <div className="space-y-2 text-slate-300">
                  {ledger.length ? ledger.map((entry) => (
                    <div key={entry.month} className="grid grid-cols-5 gap-2 text-xs border border-slate-800/60 rounded-2xl bg-slate-950/80 p-3">
                      <span>{entry.month}</span>
                      <span>Rent {formatCurrency(entry.rent)}</span>
                      <span>Paid {formatCurrency(entry.paid)}</span>
                      <span>Due {formatCurrency(entry.due)}</span>
                      <span>Adv {formatCurrency(entry.advance)}</span>
                    </div>
                  )) : <div className="text-sm text-slate-400">No ledger entries yet</div>}
                </div>
              </div>
            )
          }

          const payment = payments.find((p) => p.id === viewingPayment)
          if (!payment) return null
          const boarder = boarders.find((b) => b.id === payment.boarderId)
          const room = rooms.find((r) => r.id === boarder?.room || r.roomNumber === boarder?.room)
          const rent = room?.price || 0
          const paymentsFor = payments.filter((p) => p.boarderId === boarder?.id)
          const totalPaid = paymentsFor.reduce((s, p) => s + p.amount, 0)
          const due = Math.max(0, rent - totalPaid)
          const advance = Math.max(0, totalPaid - rent)
          return (
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              <p><strong>Boarder name:</strong> {boarder?.name || payment.guest || 'Unknown'}</p>
              <p><strong>Room:</strong> {room?.roomNumber || payment.room || 'Unknown'}</p>
              <p><strong>Payment amount:</strong> {formatCurrency(payment.amount)}</p>
              <p><strong>Payment date:</strong> {payment.date || 'N/A'}</p>
              <p><strong>Month:</strong> {(payment.date || payment.dueDate).slice(0, 7) || 'N/A'}</p>
              <p><strong>Payment method:</strong> {payment.method}</p>
              <p><strong>Notes:</strong> {payment.notes || 'None'}</p>
              <p><strong>Room rent:</strong> {formatCurrency(rent)}</p>
              <p><strong>Total paid (all months):</strong> {formatCurrency(totalPaid)}</p>
              <p><strong>Remaining due:</strong> {formatCurrency(due)}</p>
              <p><strong>Advance balance:</strong> {formatCurrency(advance)}</p>
            </div>
          )
        })()}
      </Modal>
      <ConfirmModal open={!!confirmDelete} title="Delete payment" message="Are you sure you want to delete this payment?" onConfirm={() => { if (confirmDelete) { removePayment(confirmDelete); setConfirmDelete(null) } }} onCancel={() => setConfirmDelete(null)} />

      <section className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Recent Transactions</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Latest payments</h2>
          </div>
          <span className="rounded-full bg-slate-800/80 px-3 py-1 text-sm font-medium text-slate-300">Newest first</span>
        </div>
        <div className="space-y-3">
          {filteredPayments.slice(0, 5).map((rec) => (
            <div key={rec.id} className="rounded-3xl border border-slate-800/80 bg-slate-950/90 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-white">{rec.boarderName}</p>
                <p className="text-sm text-slate-400">{rec.date || 'No date'}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-emerald-400">{formatCurrency(rec.amount)}</p>
                <p className="text-sm text-slate-400">{rec.method}</p>
              </div>
            </div>
          ))}
          {!filteredPayments.length && (
            <div className="rounded-3xl border border-slate-800/80 bg-slate-950/90 px-4 py-6 text-center text-slate-400">
              No recent transactions match the current filters.
            </div>
          )}
        </div>
      </section>

      {/* Payment methods summary */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
          <h3 className="text-lg font-semibold text-white">Payment Methods</h3>
          <div className="mt-6 space-y-4">
            {paymentMethods.map((item) => (
              <div key={item.method}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-medium text-slate-300">{item.method}</p>
                  <span className="text-sm font-semibold text-white">{formatCurrency(item.amount)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                  className="h-2 rounded-full bg-linear-to-r from-sky-500 to-indigo-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
          <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
          <div className="mt-6 space-y-4">
            {paymentRecords.slice(0, 4).map((rec) => (
              <div key={rec.id} className="flex items-center justify-between rounded-2xl border border-slate-800/50 bg-slate-950/50 px-4 py-3">
                <div>
                  <p className="font-medium text-white">{rec.boarderName}</p>
                  <p className="text-sm text-slate-500">{rec.date || 'Pending'}</p>
                </div>
                <p className="font-semibold text-emerald-400">{formatCurrency(rec.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
