from pathlib import Path

root = Path(r'c:\HostelPro2')

sidebar = '''import { NavLink } from 'react-router-dom'
import { Home, Users, Building2, CreditCard, BarChart3, Settings, Sparkles } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: Home },
  { label: 'Boarders', path: '/boarders', icon: Users },
  { label: 'Rooms', path: '/rooms', icon: Building2 },
  { label: 'Payments', path: '/payments', icon: CreditCard },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-800/80 bg-slate-950 p-6 text-slate-100 md:flex">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 to-indigo-500 text-slate-950 shadow-lg shadow-slate-950/20">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Hostel Pro</p>
          <h1 className="text-xl font-semibold text-white">Admin Dashboard</h1>
        </div>
      </div>

      <div className="space-y-2 rounded-[32px] border border-slate-800/70 bg-slate-900/80 p-4 shadow-inner shadow-slate-950/10">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Live status</p>
        <p className="mt-3 text-sm font-semibold text-white">23 boarders active</p>
        <p className="text-sm text-slate-400">Rooms occupied: 12/14</p>
      </div>

      <nav className="mt-10 flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-xl shadow-slate-950/20'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`
              }
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-slate-300 transition">
                <Icon className="h-5 w-5" />
              </span>
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-10 rounded-[28px] border border-slate-800/70 bg-slate-900/80 p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-500/15 text-emerald-300">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Admin</p>
            <p className="text-xs text-slate-500">Manage settings</p>
          </div>
        </div>
        <button className="mt-5 w-full rounded-3xl bg-slate-800 px-3 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700">
          Sign out
        </button>
      </div>
    </aside>
  )
}
'''

main = '''import { Outlet } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import Sidebar from '../components/Sidebar'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex">
        <Sidebar />

        <div className="flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 px-4 py-4 shadow-sm shadow-slate-950/10 md:px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Hostel Pro</p>
                <h1 className="text-xl font-semibold text-white md:text-2xl">Modern dashboard</h1>
              </div>
              <div className="flex items-center gap-3">
                <button className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-300 transition hover:bg-slate-800">
                  <Search className="h-5 w-5" />
                </button>
                <button className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-300 transition hover:bg-slate-800">
                  <Bell className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>

          <main className="px-4 py-6 md:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
'''

page = '''import { BarChart3, CreditCard, Home, Users, Layers2, ArrowUpRight, Wallet, CalendarDays } from 'lucide-react'
import type { DashboardMetric, RoomStatus, PaymentRecord, ReportStat } from '../types'

const metrics: DashboardMetric[] = [
  { label: 'Total Boarders', value: '124', change: '+7.2%', icon: 'Users', accent: 'from-indigo-500 to-sky-500' },
  { label: 'Available Rooms', value: '14', change: '-1.5%', icon: 'Home', accent: 'from-emerald-500 to-teal-500' },
  { label: 'Monthly Revenue', value: '$18.4k', change: '+12%', icon: 'CreditCard', accent: 'from-violet-500 to-fuchsia-500' },
  { label: 'Reports Issued', value: '8', change: '+18%', icon: 'BarChart3', accent: 'from-slate-500 to-slate-400' },
]

const rooms: RoomStatus[] = [
  { name: 'Maple Suite', occupancy: 4, capacity: 4, status: 'Occupied' },
  { name: 'Oak Hall', occupancy: 2, capacity: 4, status: 'Limited' },
  { name: 'Pine Studio', occupancy: 0, capacity: 2, status: 'Available' },
]

const payments: PaymentRecord[] = [
  { id: 'PMT-0238', guest: 'Nina Patel', amount: '$420', status: 'Paid', date: 'Jun 12' },
  { id: 'PMT-0239', guest: 'Marcus Lee', amount: '$350', status: 'Pending', date: 'Jun 13' },
  { id: 'PMT-0240', guest: 'Sara Wong', amount: '$520', status: 'Paid', date: 'Jun 14' },
]

const stats: ReportStat[] = [
  { title: 'Occupancy Rate', value: '92%', trend: '+4.5%' },
  { title: 'Late Payments', value: '3', trend: '-12%' },
  { title: 'Service Requests', value: '18', trend: '+22%' },
]

const iconMap = {
  Users,
  Home,
  CreditCard,
  BarChart3,
  Layers2,
}

const DashboardPage = () => (
  <div className="space-y-8">
    <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
      <div className="rounded-[32px] border border-slate-800/70 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
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
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br ${metric.accent} text-white shadow-lg shadow-slate-950/30`}>
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

      <div className="space-y-6 rounded-[32px] border border-slate-800/70 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
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
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-4 rounded-3xl border border-slate-800/80 bg-slate-950/90 px-4 py-4">
                <div>
                  <p className="font-semibold text-slate-100">{payment.guest}</p>
                  <p className="text-sm text-slate-500">{payment.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-white">{payment.amount}</p>
                  <p className="text-sm text-slate-500">{payment.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <section className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-[32px] border border-slate-800/70 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
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
                  <p className="mt-1 text-sm text-slate-500">{room.occupancy} / {room.capacity} occupants</p>
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
                  style={{ width: `${(room.occupancy / room.capacity) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-800/70 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
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
              <div className="h-3 w-3/4 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" />
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
              <div className="h-3 w-5/6 rounded-full bg-gradient-to-r from-emerald-500 to-lime-400" />
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

export default DashboardPage
'''

(root / 'src' / 'pages' / 'DashboardPage.tsx').write_text(page, encoding='utf-8')
print('written all files')
PY