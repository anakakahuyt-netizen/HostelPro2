import { Building2, Search, Filter, Plus, Eye, Edit2, Trash2, Zap, Users, TrendingUp } from 'lucide-react'
import { useRoomStore } from '../store/roomStore'
import { useBoarderStore } from '../store/boarderStore'
import Modal from '../components/modals/Modal'
import ConfirmModal from '../components/modals/ConfirmModal'
import RoomForm from '../components/forms/RoomForm'
import { useState, useMemo } from 'react'

const iconMap = {
  Building2,
  Users,
  Zap,
  TrendingUp,
}

export default function RoomsPage() {
  const statusStyles: Record<string, string> = {
    Available: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    Occupied: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    Limited: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    Maintenance: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
    Full: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    Empty: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  }
 
  const rooms = useRoomStore((s) => s.rooms)
  const addRoom = useRoomStore((s) => s.addRoom)
  const updateRoom = useRoomStore((s) => s.updateRoom)
  const removeRoom = useRoomStore((s) => s.removeRoom)
  const boarders = useBoarderStore((s) => s.boarders)

  const [openAdd, setOpenAdd] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const roomsWithCounts = useMemo(() => rooms
    .map((r) => {
      const occupied = boarders.filter((b) => b.room === r.id || b.room === r.roomNumber).length
      const available = Math.max(0, r.capacity - occupied)
      const occupancyStatus = r.status === 'Maintenance'
        ? 'Maintenance'
        : occupied === 0
        ? 'Empty'
        : occupied >= r.capacity
        ? 'Full'
        : 'Available'
      return { ...r, occupied, available, occupancyStatus }
    })
    .filter((room) =>
      room.roomNumber.toLowerCase().includes(query.toLowerCase()) &&
      (!statusFilter || room.occupancyStatus === statusFilter)
    ),
  [rooms, boarders, query, statusFilter])

  const total = roomsWithCounts.length
  const occupiedCount = roomsWithCounts.reduce((c, r) => c + (r.occupied > 0 ? 1 : 0), 0)
  const availableCount = roomsWithCounts.filter((r) => r.available > 0).length
  const maintenanceCount = roomsWithCounts.filter((r) => r.occupancyStatus === 'Maintenance').length
  const typeCounts = rooms.reduce<Record<string, number>>((acc, room) => {
    acc[room.type] = (acc[room.type] || 0) + 1
    return acc
  }, {})
  const floorTotals = rooms.reduce<Record<string, { occupied: number; capacity: number }>>((acc, room) => {
    const occupied = boarders.filter((b) => b.room === room.id || b.room === room.roomNumber).length
    const key = `Floor ${room.floor}`
    acc[key] = {
      occupied: (acc[key]?.occupied || 0) + occupied,
      capacity: (acc[key]?.capacity || 0) + room.capacity,
    }
    return acc
  }, {})
  const floorOccupancy = Object.fromEntries(
    Object.entries(floorTotals).map(([floor, totals]) => [floor, totals.capacity ? (totals.occupied / totals.capacity) * 100 : 0])
  )
  const monthlyRevenue = rooms.reduce((sum, room) => sum + room.price * room.occupied, 0)
  const averageRevenuePerRoom = occupiedCount ? monthlyRevenue / occupiedCount : 0

  return (
    <div className="space-y-8">
      {/* Header section */}
      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Accommodation</p>
            <h1 className="mt-2 text-4xl font-bold text-white">Room Management</h1>
            <p className="mt-3 text-slate-400">Manage hostel rooms and track occupancy</p>
          </div>
          <button onClick={() => setOpenAdd(true)} className="inline-flex items-center gap-2 rounded-3xl bg-linear-to-r from-emerald-500 to-teal-500 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:shadow-lg hover:shadow-emerald-500/50">
            <Plus className="h-5 w-5" />
            Add Room
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Rooms', value: String(total), change: 'All active', icon: 'Building2', accent: 'from-sky-500 to-indigo-500' },
            { label: 'Occupied', value: String(occupiedCount), change: `${Math.round((occupiedCount / Math.max(total, 1)) * 100)}%`, icon: 'Users', accent: 'from-emerald-500 to-teal-500' },
            { label: 'Available', value: String(availableCount), change: 'Ready', icon: 'Building2', accent: 'from-amber-500 to-orange-500' },
            { label: 'Maintenance', value: String(maintenanceCount), change: 'Check', icon: 'Zap', accent: 'from-violet-500 to-fuchsia-500' },
          ].map((stat) => {
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
              placeholder="Search by room number..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-12 pr-4 text-slate-100 placeholder-slate-500 transition focus:border-sky-500 focus:outline-none"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4 text-slate-100">
            <option value="">All statuses</option>
            <option value="Available">Available</option>
            <option value="Full">Full</option>
            <option value="Empty">Empty</option>
            <option value="Maintenance">Maintenance</option>
          </select>
          <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-medium text-slate-300 transition hover:bg-slate-800">
            <Filter className="h-5 w-5" />
            Filters
          </button>
        </div>
      </section>

      {/* Rooms grid */}
      <section className="grid gap-6 lg:grid-cols-2">
        {roomsWithCounts.map((room) => (
          <div key={room.id} className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{room.id}</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{room.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{room.type} Room • Floor {room.floor}</p>
              </div>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[room.occupancyStatus]}`}>
                {room.occupancyStatus}
              </span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Occupancy</p>
                <p className="text-lg font-semibold text-white">{room.occupied} / {room.capacity}</p>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-800">
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

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-2xl border border-slate-800/50 bg-slate-950/50 px-4 py-3">
                <p className="text-xs text-slate-500">Monthly Rate</p>
                <p className="mt-1 text-lg font-semibold text-emerald-400">${room.price}</p>
              </div>
              <div className="rounded-2xl border border-slate-800/50 bg-slate-950/50 px-4 py-3">
                <p className="text-xs text-slate-500">Capacity</p>
                <p className="mt-1 text-lg font-semibold text-sky-400">{room.capacity} guests</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500 mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {room.amenities.map((amenity) => (
                  <span key={amenity} className="inline-flex items-center rounded-full bg-slate-800/50 px-3 py-1 text-xs font-medium text-slate-300">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-slate-800/50 pt-6">
              <button onClick={() => setViewing(room.id)} className="flex-1 inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-sky-400">
                <Eye className="h-4 w-4" />
              </button>
              <button onClick={() => setEditing(room.id)} className="flex-1 inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-amber-400">
                <Edit2 className="h-4 w-4" />
              </button>
              <button onClick={() => {
                const count = boarders.filter((b) => b.room === room.id || b.room === room.roomNumber).length
                if (count > 0) {
                  setDeleteWarning(`Cannot delete ${room.name}. It has ${count} boarder(s) assigned. Remove them first.`)
                } else {
                  setConfirmDelete(room.id)
                }
              }} className="flex-1 inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-rose-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </section>

      <Modal open={openAdd} onClose={() => setOpenAdd(false)}>
        <h3 className="text-lg font-semibold text-white">Add Room</h3>
        <div className="mt-4">
          <RoomForm onSubmit={(r) => { addRoom(r); setOpenAdd(false) }} />
        </div>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)}>
        <h3 className="text-lg font-semibold text-white">Edit Room</h3>
        <div className="mt-4">
          <RoomForm initial={rooms.find((r) => r.id === editing) || undefined} onSubmit={(r) => { updateRoom(r.id, r); setEditing(null) }} />
        </div>
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)}>
        <h3 className="text-lg font-semibold text-white">Room Details</h3>
        {(() => {
          const room = roomsWithCounts.find((r) => r.id === viewing)
          return room ? (
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              <p><strong>Room number:</strong> {room.roomNumber}</p>
              <p><strong>Capacity:</strong> {room.capacity}</p>
              <p><strong>Occupied beds:</strong> {room.occupied}</p>
              <p><strong>Available beds:</strong> {room.available}</p>
              <p><strong>Monthly rent:</strong> ${room.price}</p>
              <p><strong>Status:</strong> {room.occupancyStatus}</p>
            </div>
          ) : null
        })()}
      </Modal>

      <ConfirmModal open={!!confirmDelete} title="Delete room" message={confirmDelete || ''} onConfirm={() => { if (confirmDelete) { removeRoom(confirmDelete); setConfirmDelete(null) } }} onCancel={() => setConfirmDelete(null)} />
      <ConfirmModal open={!!deleteWarning} title="Cannot delete room" message="This room contains active boarders and cannot be deleted." onConfirm={() => { setDeleteWarning(null) }} onCancel={() => setDeleteWarning(null)} />

      {/* Room statistics */}
      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-white">By Type</h3>
            <Building2 className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            {Object.entries(typeCounts).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{type}</span>
                <span className="font-semibold text-white">{count} rooms</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-white">By Floor</h3>
            <TrendingUp className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            {Object.entries(floorOccupancy).map(([floor, occupancy]) => (
              <div key={floor}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm text-slate-400">{floor}</span>
                  <span className="text-sm font-semibold text-white">{Math.round(occupancy)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-linear-to-r from-sky-500 to-indigo-500"
                    style={{ width: `${Math.min(100, Math.max(0, occupancy))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Revenue</h3>
          <p className="text-4xl font-bold text-emerald-400">${monthlyRevenue.toLocaleString()}</p>
          <p className="mt-2 text-sm text-slate-400">From {occupiedCount} occupied rooms</p>
          <div className="mt-4 pt-4 border-t border-slate-800/50">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Average per occupied room</p>
            <p className="mt-2 text-2xl font-semibold text-sky-400">${averageRevenuePerRoom.toFixed(0)}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
