import { NavLink } from 'react-router-dom'
import { Home, Users, Building2, CreditCard, BarChart3, Settings, Sparkles } from 'lucide-react'
import { useUiStore } from '../store/uiStore'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: Home },
  { label: 'Boarders', path: '/boarders', icon: Users },
  { label: 'Rooms', path: '/rooms', icon: Building2 },
  { label: 'Payments', path: '/payments', icon: CreditCard },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: Settings },
]

export default function Sidebar() {
  const { sidebarOpen, closeSidebar } = useUiStore()

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform overflow-hidden border-r border-slate-800/80 bg-slate-950 p-6 text-slate-100 shadow-2xl shadow-slate-950/40 transition duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-linear-to-br from-sky-500 to-indigo-500 text-slate-950 shadow-lg shadow-slate-950/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Hostel Pro</p>
            <h1 className="text-xl font-semibold text-white">Admin Dashboard</h1>
          </div>
        </div>

        <div className="space-y-2 rounded-4xl border border-slate-800/70 bg-slate-900/80 p-4 shadow-inner shadow-slate-950/10">
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
                onClick={closeSidebar}
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

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-slate-950/70 md:hidden" onClick={closeSidebar} />}
    </>
  )
}