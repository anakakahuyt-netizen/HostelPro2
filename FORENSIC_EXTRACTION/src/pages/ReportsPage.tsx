import { BarChart3, PieChart, TrendingUp, Download, Calendar, Filter, ArrowUp, ArrowDown } from 'lucide-react'
import { useBoarderStore } from '../store/boarderStore'
import { useRoomStore } from '../store/roomStore'
import { usePaymentStore } from '../store/paymentStore'
import { downloadCSV } from '../services/export'

interface Report {
  id: string
  name: string
  type: 'Occupancy' | 'Financial' | 'Maintenance' | 'Guest'
  period: string
  status: 'Completed' | 'In Progress' | 'Pending'
  generatedDate: string
  fileSize: string
}

const reports: Report[] = [
  { id: 'RPT-001', name: 'Monthly Occupancy Report', type: 'Occupancy', period: 'June 2026', status: 'Completed', generatedDate: '2026-06-15', fileSize: '2.4 MB' },
  { id: 'RPT-002', name: 'Financial Summary', type: 'Financial', period: 'Q2 2026', status: 'Completed', generatedDate: '2026-06-14', fileSize: '3.1 MB' },
  { id: 'RPT-003', name: 'Maintenance Requests', type: 'Maintenance', period: 'May-June 2026', status: 'Completed', generatedDate: '2026-06-10', fileSize: '1.8 MB' },
  { id: 'RPT-004', name: 'Guest Satisfaction Survey', type: 'Guest', period: 'Q2 2026', status: 'In Progress', generatedDate: '2026-06-12', fileSize: '-' },
  { id: 'RPT-005', name: 'Quarterly Performance Review', type: 'Financial', period: 'Q2 2026', status: 'Pending', generatedDate: '', fileSize: '-' },
]

const analytics = [
  { label: 'Avg. Occupancy Rate', value: '87.5%', change: '+3.2%', icon: TrendingUp, accent: 'from-emerald-500 to-teal-500' },
  { label: 'Total Revenue', value: '$52.4k', change: '+12.8%', icon: TrendingUp, accent: 'from-sky-500 to-indigo-500' },
  { label: 'Guest Satisfaction', value: '4.6/5.0', change: '+0.3', icon: TrendingUp, accent: 'from-violet-500 to-fuchsia-500' },
  { label: 'Maintenance Issues', value: '14', change: '-2 vs last month', icon: TrendingUp, accent: 'from-orange-500 to-red-500' },
]

export default function ReportsPage() {
  const boarders = useBoarderStore((s) => s.boarders)
  const rooms = useRoomStore((s) => s.rooms)
  const payments = usePaymentStore((s) => s.payments)

  const nowMonth = new Date().toISOString().slice(0,7)

  const monthlyIncomeReport = payments.reduce<Record<string, number>>((acc, p) => {
    const m = (p.date || '').slice(0,7) || nowMonth
    acc[m] = (acc[m] || 0) + p.amount
    return acc
  }, {})

  const pendingDuesReport = boarders.map((b) => {
    const paid = payments.filter((p) => p.boarderId === b.id).reduce((s, p) => s + p.amount, 0)
    return { id: b.id, name: b.name, room: b.room, monthlyRent: b.monthlyRent, paid, due: Math.max(0, b.monthlyRent - paid) }
  })

  const occupancyReport = rooms.map((r) => ({ id: r.id, name: r.name, roomNumber: r.roomNumber, capacity: r.capacity, occupied: r.occupied, occupancyRate: r.capacity ? Math.round((r.occupied / r.capacity) * 100) : 0 }))

  const totalBoardersReport = { total: boarders.length }
  const exportTotalBoarders = () => {
    downloadCSV('total-boarders.csv', [totalBoardersReport])
  }

  const exportMonthlyIncome = () => {
    const items = Object.entries(monthlyIncomeReport).map(([month, amount]) => ({ month, amount }))
    downloadCSV('monthly-income.csv', items)
  }

  const exportPendingDues = () => {
    downloadCSV('pending-dues.csv', pendingDuesReport)
  }

  const exportOccupancy = () => {
    downloadCSV('occupancy.csv', occupancyReport)
  }

  const exportBoarders = () => {
    downloadCSV('boarders.csv', boarders)
  }

  const exportPayments = () => {
    downloadCSV('payments.csv', payments)
  }

  const statusStyles = {
    Completed: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    'In Progress': 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    Pending: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  }

  const typeColors = {
    Occupancy: 'text-sky-400',
    Financial: 'text-emerald-400',
    Maintenance: 'text-amber-400',
    Guest: 'text-violet-400',
  }

  return (
    <div className="space-y-8">
      {/* Header section */}
      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Analytics</p>
            <h1 className="mt-2 text-4xl font-bold text-white">Reports & Analytics</h1>
            <p className="mt-3 text-slate-400">View comprehensive reports and business analytics</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-3xl bg-linear-to-r from-violet-500 to-fuchsia-500 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:shadow-lg hover:shadow-violet-500/50">
            <BarChart3 className="h-5 w-5" />
            Generate Report
          </button>
        </div>

        {/* Analytics cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {analytics.map((stat) => {
            const Icon = stat.icon
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

      {/* Filters */}
      <section className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-3">
          <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-medium text-slate-300 transition hover:bg-slate-800">
            <Calendar className="h-5 w-5" />
            Date Range
          </button>
          <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-medium text-slate-300 transition hover:bg-slate-800">
            <Filter className="h-5 w-5" />
            Report Type
          </button>
          <div className="flex-1" />
          <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-medium text-slate-300 transition hover:bg-slate-800">
            <Download className="h-5 w-5" />
            Export
          </button>
          <div className="ml-3 inline-flex items-center gap-2">
            <button onClick={exportMonthlyIncome} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300">Export Monthly Income</button>
            <button onClick={exportPendingDues} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300">Export Pending Dues</button>
            <button onClick={exportOccupancy} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300">Export Occupancy</button>
            <button onClick={exportBoarders} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300">Export Boarders</button>
            <button onClick={exportPayments} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300">Export Payments</button>
            <button onClick={exportTotalBoarders} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300">Export Total Boarders</button>
          </div>
        </div>
      </section>

      {/* Reports table */}
      <section className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Generated Reports</h2>
          <span className="rounded-full bg-slate-800/80 px-3 py-1 text-sm font-medium text-slate-300">{reports.length} total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Report ID</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Report Name</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Type</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Period</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Generated</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Status</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">File Size</th>
                <th className="px-4 py-4 text-left text-xs uppercase tracking-[0.28em] text-slate-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {reports.map((report) => (
                <tr key={report.id} className="transition hover:bg-slate-800/40">
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm font-semibold text-violet-400">{report.id}</span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-white">{report.name}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-sm font-semibold ${typeColors[report.type]}`}>{report.type}</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-400">{report.period}</td>
                  <td className="px-4 py-4 text-sm text-slate-400">{report.generatedDate || '-'}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[report.status]}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-slate-300">{report.fileSize}</td>
                  <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => downloadCSV(`${report.id}.csv`, [report as any])} className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-violet-400">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Report statistics */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h3 className="text-lg font-semibold text-white">Key Metrics</h3>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {[
              { metric: 'Total Boarders YTD', value: '145', trend: '+18%' },
              { metric: 'Occupancy Trend', value: '87.5%', trend: '+5.2%' },
              { metric: 'Revenue Growth', value: '$52.4k', trend: '+12.8%' },
              { metric: 'Repeat Guests', value: '34%', trend: '+3.1%' },
            ].map((item) => (
              <div key={item.metric} className="flex items-center justify-between rounded-2xl border border-slate-800/50 bg-slate-950/50 px-4 py-3">
                <p className="text-sm font-medium text-slate-300">{item.metric}</p>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white">{item.value}</p>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300">{item.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h3 className="text-lg font-semibold text-white">Monthly Comparison</h3>
            <PieChart className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {[
              { month: 'May 2026', revenue: '$48.2k', change: -4.1 },
              { month: 'June 2026', revenue: '$52.4k', change: 8.7 },
              { month: 'July 2026', revenue: '$58.1k', change: 10.9 },
            ].map((item) => (
              <div key={item.month}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-slate-300">{item.month}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">{item.revenue}</p>
                    {item.change > 0 ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300">
                        <ArrowUp className="h-3 w-3" /> {item.change}%
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-1 text-xs font-medium text-rose-300">
                        <ArrowDown className="h-3 w-3" /> {Math.abs(item.change)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                  className="h-2 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500"
                    style={{ width: `${Math.min((parseFloat(item.revenue) / 70) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
