import { useState, useMemo } from 'react'
import { Search, Filter, Download, Plus, Eye, Edit2, Trash2, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { usePaymentStore } from '../store/paymentStore'
import { useBoarderStore } from '../store/boarderStore'
import type { Payment } from '../types'
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
  }
 
  const payments = usePaymentStore((s) => s.payments)
  const addPayment = usePaymentStore((s) => s.addPayment)
  const updatePayment = usePaymentStore((s) => s.updatePayment)
  const removePayment = usePaymentStore((s) => s.removePayment)
  const boarders = useBoarderStore((s) => s.boarders)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterBoarder, setFilterBoarder] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [editingPayment, setEditingPayment] = useState<string | null>(null)
  const [viewingPayment, setViewingPayment] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const totalCollected = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments])
  const pendingAmount = useMemo(() => payments.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.amount, 0), [payments])
  const overdueAmount = useMemo(() => payments.filter((p) => p.status === 'Overdue').reduce((s, p) => s + p.amount, 0), [payments])
  const paidCount = useMemo(() => payments.filter((p) => p.status === 'Paid').length, [payments])
  const successRate = useMemo(() => (payments.length ? Math.round((paidCount / payments.length) * 100) : 0), [payments, paidCount])
  const successChangeLabel = payments.length ? `${paidCount} paid` : 'No payments'
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

  const paymentStats = [
    { label: 'Total Collected', value: `$${totalCollected}`, change: '', icon: 'TrendingUp', accent: 'from-emerald-500 to-teal-500' },
    { label: 'Pending Payments', value: `$${pendingAmount}`, change: `${payments.filter((p) => p.status === 'Pending').length} invoices`, icon: 'AlertCircle', accent: 'from-amber-500 to-orange-500' },
    { label: 'Overdue', value: `$${overdueAmount}`, change: `${payments.filter((p) => p.status === 'Overdue').length} overdue`, icon: 'AlertCircle', accent: 'from-rose-500 to-pink-500' },
    { label: 'Success Rate', value: `${successRate}%`, change: successChangeLabel, icon: 'CheckCircle2', accent: 'from-blue-500 to-cyan-500' },
  ]

  const dueMap = useMemo(() => {
    const map: Record<string, number> = {}
    boarders.forEach((boarder) => {
      const paid = payments.filter((p) => p.boarderId === boarder.id && p.status === 'Paid').reduce((s, p) => s + p.amount, 0)
      map[boarder.id] = Math.max(0, boarder.monthlyRent - paid)
    })
    return map
  }, [boarders, payments])

  const normalizeStatus = (status: string) => {
    if (status === 'Paid') return 'Paid'
    if (status === 'Partial') return 'Partial'
    return 'Due'
  }

  const filtered = payments.filter((payment) => {
    if (searchQuery && !payment.guest.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterBoarder && payment.boarderId !== filterBoarder) return false
    if (filterMonth) {
      const month = payment.date.slice(0, 7)
      if (month !== filterMonth) return false
    }
    if (filterStatus && normalizeStatus(payment.status) !== filterStatus) return false
    return true
  })

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
            return (
              <div key={stat.label} className="rounded-[28px] border border-slate-800/80 bg-slate-900/90 p-5 shadow-lg shadow-slate-950/20">
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
              </div>
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
          <span className="rounded-full bg-slate-800/80 px-3 py-1 text-sm font-medium text-slate-300">{payments.length} total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Payment ID</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Guest</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Room</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Amount</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Due Date</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Status</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Method</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((payment) => (
                <tr key={payment.id} className="transition hover:bg-slate-800/40">
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm font-semibold text-sky-400">{payment.id}</span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-white">{payment.guest}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center rounded-full bg-slate-800/50 px-3 py-1 text-sm text-slate-300">{payment.room}</span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-emerald-400">${payment.amount}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-400">{payment.dueDate}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[payment.status]}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-400">{payment.method}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewingPayment(payment.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-sky-400">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setEditingPayment(payment.id); setShowModal(true) }} className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-amber-400">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => setConfirmDelete(payment.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-rose-400">
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
        <div className="mt-6 flex items-center justify-between border-t border-slate-800/50 pt-6">
          <p className="text-sm text-slate-400">Showing 1 to {payments.length} of {payments.length} results</p>
          <div className="flex gap-2">
            <button className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50">
              Previous
            </button>
            <button className="rounded-lg bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-400 border border-sky-500/50">1</button>
            <button className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800">
              Next
            </button>
          </div>
        </div>
      </section>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditingPayment(null) }}>
        <h3 className="text-lg font-semibold text-white">{editingPayment ? 'Edit Payment' : 'New Payment'}</h3>
        <div className="mt-4">
          <PaymentForm boarders={boarders} initial={currentPayment ?? undefined} onSubmit={handleSavePayment} />
        </div>
      </Modal>
      <Modal open={!!viewingPayment} onClose={() => setViewingPayment(null)}>
        <h3 className="text-lg font-semibold text-white">Payment Details</h3>
        {(() => {
          const payment = payments.find((p) => p.id === viewingPayment)
          if (!payment) return null
          return (
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              <p><strong>Boarder name:</strong> {payment.guest}</p>
              <p><strong>Room:</strong> {payment.room}</p>
              <p><strong>Payment amount:</strong> ${payment.amount}</p>
              <p><strong>Payment date:</strong> {payment.date || 'N/A'}</p>
              <p><strong>Month:</strong> {(payment.date || payment.dueDate).slice(0, 7) || 'N/A'}</p>
              <p><strong>Payment method:</strong> {payment.method}</p>
              <p><strong>Notes:</strong> {payment.notes || 'None'}</p>
              <p><strong>Remaining due:</strong> ${dueMap[payment.boarderId] ?? 0}</p>
            </div>
          )
        })()}
      </Modal>
      <ConfirmModal open={!!confirmDelete} title="Delete payment" message="Are you sure you want to delete this payment?" onConfirm={() => { if (confirmDelete) { removePayment(confirmDelete); setConfirmDelete(null) } }} onCancel={() => setConfirmDelete(null)} />

      {/* Payment methods summary */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
          <h3 className="text-lg font-semibold text-white">Payment Methods</h3>
          <div className="mt-6 space-y-4">
            {paymentMethods.map((item) => (
              <div key={item.method}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-medium text-slate-300">{item.method}</p>
                  <span className="text-sm font-semibold text-white">${item.amount.toLocaleString()}</span>
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
            {payments.slice(0, 4).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between rounded-2xl border border-slate-800/50 bg-slate-950/50 px-4 py-3">
                <div>
                  <p className="font-medium text-white">{payment.guest}</p>
                  <p className="text-sm text-slate-500">{payment.date || 'Pending'}</p>
                </div>
                <p className="font-semibold text-emerald-400">${payment.amount}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
