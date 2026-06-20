import { BarChart3, CreditCard, Home, Users, Layers2, ArrowUpRight, Wallet, CalendarDays } from 'lucide-react'
import { useBoarderStore } from '../store/boarderStore'
import { useRoomStore } from '../store/roomStore'
import { usePaymentStore } from '../store/paymentStore'

const iconMap = {
  Users,
  Home,
  CreditCard,
  BarChart3,
  Layers2,
}

const DashboardPage = () => {
  const boarders = useBoarderStore((s) => s.boarders)
  const rooms = useRoomStore((s) => s.rooms)
  const payments = usePaymentStore((s) => s.payments)

  const occupiedRooms = rooms.filter((room) => room.occupied > 0).length
  const totalRooms = rooms.length
  const totalCapacity = rooms.reduce((s, r) => s + (r.capacity || 0), 0)
  const totalOccupiedBeds = rooms.reduce((s, r) => s + (r.occupied || 0), 0)
  const availableBeds = Math.max(0, totalCapacity - totalOccupiedBeds)

  const nowMonth = new Date().toISOString().slice(0, 7)
  const monthlyIncome = payments.filter((p) => p.date && p.date.slice(0, 7) === nowMonth).reduce((s, p) => s + p.amount, 0)
  const pendingPayments = payments.filter((payment) => payment.status === 'Pending').length
  const overduePayments = payments.filter((payment) => payment.status === 'Overdue').length

  const pendingDues = boarders.reduce((sum, boarder) => {
    const paidThisMonth = payments.filter((p) => p.boarderId === boarder.id && p.date && p.date.slice(0, 7) === nowMonth).reduce((s, p) => s + p.amount, 0)
    return sum + Math.max(0, boarder.monthlyRent - paidThisMonth)
  }, 0)

  const metrics = [
    { label: 'Total Boarders', value: String(boarders.length), change: `${occupiedRooms} rooms occupied`, icon: 'Users', accent: 'from-indigo-500 to-sky-500' },
    { label: 'Total Rooms', value: String(totalRooms), change: `${availableBeds} beds available`, icon: 'Home', accent: 'from-emerald-500 to-teal-500' },
    { label: 'Monthly Income', value: `$${monthlyIncome}`, change: `${pendingPayments} pending`, icon: 'CreditCard', accent: 'from-violet-500 to-fuchsia-500' },
    { label: 'Pending Dues', value: `$${pendingDues}`, change: `${overduePayments} overdue`, icon: 'BarChart3', accent: 'from-slate-500 to-slate-400' },
  ]

  const stats = [
    { title: 'Occupancy Rate', value: `${Math.round((totalOccupiedBeds / Math.max(totalCapacity, 1)) * 100)}%`, trend: `${totalOccupiedBeds} of ${totalCapacity} beds` },
    { title: 'Late Payments', value: String(overduePayments), trend: `${pendingPayments} pending` },
    { title: 'Pending Dues', value: `$${pendingDues}`, trend: `${boarders.length} boarders` },
  ]

  return (
  <div className="space-y-8">
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
              <p className="mt-2 text-sm font-semibold text-white">June 2026</p>
            </div>
            <div className="rounded-3xl bg-slate-900/90 px-4 py-3 text-slate-300 shadow-inner shadow-slate-950/10">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Active alerts</p>
              <p className="mt-2 text-sm font-semibold text-emerald-400">2 new requests</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          {metrics.map((metric) => {
            const Icon = iconMap[metric.icon as keyof typeof iconMap]
            return (
              <div key={metric.label} className="rounded-[28px] border border-slate-800/80 bg-slate-900/90 p-5 shadow-lg shadow-slate-950/20">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-linear-to-br ${metric.accent} text-white shadow-lg shadow-slate-950/30`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-sm uppercase tracking-[0.32em] text-slate-500">{metric.label}</p>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <p className="text-3xl font-semibold text-white">{metric.value}</p>
                  <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs uppercase tracking-[0.28em] text-emerald-300">
                    {metric.change}
                  </span>
                </div>
              </div>
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
            <div key={stat.title} className="rounded-[28px] border border-slate-800/80 bg-slate-900/90 p-5 shadow-sm shadow-slate-950/20">
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
            <Wallet className="h-5 w-5 text-slate-300" />
          </div>
          <div className="mt-6 space-y-3">
            {payments.slice(0,4).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-4 rounded-3xl border border-slate-800/80 bg-slate-950/90 px-4 py-4">
                <div>
                  <p className="font-semibold text-slate-100">{payment.guest}</p>
                  <p className="text-sm text-slate-500">{payment.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-white">{payment.amount}</p>
                  <p className="text-sm text-slate-500">{payment.date || 'Pending'}</p>
                </div>
              </div>
            ))}
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
            {boarders.slice(0,4).map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-4 rounded-3xl border border-slate-800/80 bg-slate-950/90 px-4 py-4">
                <div>
                  <p className="font-semibold text-slate-100">{b.name}</p>
                  <p className="text-sm text-slate-500">{b.room}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">{b.checkIn || '-'}</p>
                </div>
              </div>
            ))}
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
          <Layers2 className="h-5 w-5 text-slate-400" />
        </div>
        <div className="mt-6 space-y-4">
          {rooms.map((room) => (
            <div key={room.name} className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-5">
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
          <ArrowUpRight className="h-5 w-5 text-slate-400" />
        </div>
        <div className="mt-6 space-y-5">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Total revenue</p>
                <p className="mt-2 text-3xl font-semibold text-white">$18.4k</p>
              </div>
              <span className="rounded-3xl bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-300">+12%</span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
              <div className="h-3 w-3/4 rounded-full bg-linear-to-r from-indigo-500 to-cyan-400" />
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Expected extension</p>
                <p className="mt-2 text-2xl font-semibold text-white">$4.8k</p>
              </div>
              <span className="rounded-3xl bg-sky-500/15 px-3 py-2 text-sm font-semibold text-sky-300">On track</span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
              <div className="h-3 w-5/6 rounded-full bg-linear-to-r from-emerald-500 to-lime-400" />
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Bookings</p>
                <p className="mt-2 text-2xl font-semibold text-white">42 new</p>
              </div>
              <CalendarDays className="h-5 w-5 text-slate-400" />
            </div>
            <p className="mt-4 text-sm text-slate-400">Higher demand from premium boarders this month.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
)
}

export default DashboardPage
