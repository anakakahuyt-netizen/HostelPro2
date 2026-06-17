import { useMemo, useState } from 'react'
import { useBoarderStore } from '../store/boarderStore'
import { useRoomStore } from '../store/roomStore'
import { usePaymentStore } from '../store/paymentStore'
import { Users, Search, Filter, Plus, Eye, Edit2, Trash2, Mail, Phone, MapPin, UserCheck } from 'lucide-react'
import Modal from '../components/modals/Modal'
import ConfirmModal from '../components/modals/ConfirmModal'
import BoarderForm from '../components/forms/BoarderForm'

const iconMap = {
  Users,
  UserCheck,
}

export default function BoardersPage() {
  const boarders = useBoarderStore((state) => state.boarders)
  const addBoarder = useBoarderStore((s) => s.addBoarder)
  const updateBoarder = useBoarderStore((s) => s.updateBoarder)
  const removeBoarder = useBoarderStore((s) => s.removeBoarder)

  const [query, setQuery] = useState('')
  const [roomFilter, setRoomFilter] = useState('')
  const [openAdd, setOpenAdd] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string; message?: string } | null>(null)

  const statusStyles = {
    Active: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    Pending: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    'Checked-out': 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  }

  const totalRent = useMemo(() => boarders.reduce((sum, boarder) => sum + boarder.monthlyRent, 0), [boarders])
  const payments = usePaymentStore((s) => s.payments)
  const dueMap = useMemo(() => {
    const map: Record<string, number> = {}
    boarders.forEach((b) => {
      const paid = payments.filter((p) => p.boarderId === b.id).reduce((s, p) => s + p.amount, 0)
      map[b.id] = Math.max(0, b.monthlyRent - paid)
    })
    return map
  }, [boarders, payments])

  const totalBoarders = boarders.length
  const activeBoarders = boarders.filter((b) => b.status === 'Active').length
  const pendingBoarders = boarders.filter((b) => b.status === 'Pending').length
  const checkedOutBoarders = boarders.filter((b) => b.status === 'Checked-out').length
  const totalDue = Object.values(dueMap).reduce((sum, due) => sum + due, 0)

  const boarderStats = [
    { label: 'Total Boarders', value: String(totalBoarders), change: `${activeBoarders} active`, icon: 'Users', accent: 'from-indigo-500 to-sky-500' },
    { label: 'Active', value: String(activeBoarders), change: `${pendingBoarders} pending`, icon: 'UserCheck', accent: 'from-emerald-500 to-teal-500' },
    { label: 'Pending Rent', value: `$${totalDue}`, change: `${pendingBoarders} owed`, icon: 'Users', accent: 'from-violet-500 to-fuchsia-500' },
    { label: 'Checked-out', value: String(checkedOutBoarders), change: 'Completed', icon: 'Users', accent: 'from-orange-500 to-red-500' },
  ]

  const rooms = useRoomStore((s) => s.rooms)

  const filtered = boarders.filter((b) => {
    if (roomFilter && b.room !== roomFilter) return false
    const q = query.toLowerCase()
    return b.name.toLowerCase().includes(q) || b.phone.toLowerCase().includes(q) || b.room.toLowerCase().includes(q)
  })

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
              <option key={r.id} value={r.id}>{r.name} — {r.roomNumber}</option>
            ))}
          </select>
          <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-medium text-slate-300 transition hover:bg-slate-800">
            <Filter className="h-5 w-5" />
            Filters
          </button>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Resident List</h2>
          <span className="rounded-full bg-slate-800/80 px-3 py-1 text-sm font-medium text-slate-300">{boarders.length} total</span>
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
              {filtered.map((boarder) => (
                <tr key={boarder.id} className="transition hover:bg-slate-800/40">
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm font-semibold text-indigo-400">{boarder.id}</span>
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
                    <span className="inline-flex items-center rounded-full bg-slate-800/50 px-3 py-1 text-sm text-slate-300"><MapPin className="h-3 w-3 mr-1" />{boarder.room}</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-400">{boarder.checkIn}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[boarder.status]}`}>
                      {boarder.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-emerald-400">${boarder.monthlyRent}</p>
                    <p className="text-sm text-slate-400">Due: ${dueMap[boarder.id] ?? 0}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-sky-400">
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
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-800/50 pt-6">
          <p className="text-sm text-slate-400">Showing 1 to {boarders.length} of {boarders.length} results</p>
          <div className="flex gap-2">
            <button className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50">
              Previous
            </button>
            <button className="rounded-lg bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-400 border border-indigo-500/50">1</button>
            <button className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800">
              Next
            </button>
          </div>
        </div>
      </section>

      <Modal open={openAdd} onClose={() => setOpenAdd(false)}>
        <h3 className="text-lg font-semibold text-white">Add Boarder</h3>
        <div className="mt-4">
          <BoarderForm onSubmit={(b) => { addBoarder(b); setOpenAdd(false) }} />
        </div>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)}>
        <h3 className="text-lg font-semibold text-white">Edit Boarder</h3>
        <div className="mt-4">
          <BoarderForm initial={boarders.find((b) => b.id === editing) || undefined} onSubmit={(b) => { updateBoarder(b.id, b); setEditing(null) }} />
        </div>
      </Modal>

      <ConfirmModal open={!!confirmDelete} title="Delete boarder" message={confirmDelete?.message ?? confirmDelete?.name} onConfirm={() => { if (confirmDelete) { removeBoarder(confirmDelete.id); setConfirmDelete(null) } }} onCancel={() => setConfirmDelete(null)} />

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
          <h3 className="text-lg font-semibold text-white">Average Stay Duration</h3>
          <p className="mt-4 text-4xl font-bold text-indigo-400">8.2 months</p>
          <p className="mt-2 text-sm text-slate-400">Based on 124 residents</p>
        </div>

        <div className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
          <h3 className="text-lg font-semibold text-white">Occupancy Rate</h3>
          <p className="mt-4 text-4xl font-bold text-emerald-400">94.2%</p>
          <p className="mt-2 text-sm text-slate-400">118 of 125 rooms occupied</p>
        </div>

        <div className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
          <h3 className="text-lg font-semibold text-white">Total Monthly Rent</h3>
          <p className="mt-4 text-4xl font-bold text-emerald-400">${totalRent}</p>
          <p className="mt-2 text-sm text-slate-400">Projected recurring rent this month</p>
        </div>
      </section>
    </div>
  )
}
