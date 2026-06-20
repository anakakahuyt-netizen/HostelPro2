import { Outlet } from 'react-router-dom'
import { Bell, Search, Menu, X } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useUiStore } from '../store/uiStore'

export default function MainLayout() {
  const { sidebarOpen, toggleSidebar, closeSidebar } = useUiStore()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 md:flex">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 px-4 py-4 shadow-sm shadow-slate-950/10 transition md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSidebar}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-300 transition hover:bg-slate-800 md:hidden"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Hostel Pro</p>
                <h1 className="text-xl font-semibold text-white md:text-2xl">Modern dashboard</h1>
              </div>
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

        <main className="flex-1 px-4 py-6 md:px-6" onClick={() => sidebarOpen && closeSidebar()}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}