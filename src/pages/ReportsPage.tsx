import React, { useEffect } from 'react'
import { BarChart3, PieChart, TrendingUp, Download, Calendar, Filter, ArrowUp, ArrowDown } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useBoarderStore } from '../store/boarderStore'
import { useRoomStore } from '../store/roomStore'
import { usePaymentStore } from '../store/paymentStore'
import { downloadCSV } from '../services/export'
import { showToast } from '../services/toast'

interface Report {
  id: string
  name: string
  type: 'Occupancy' | 'Financial' | 'Maintenance' | 'Guest'
  period: string
  status: 'Completed' | 'In Progress' | 'Pending'
  generatedDate: string
  fileSize: string
}

export default function ReportsPage() {
  const boarders = useBoarderStore((s) => s.boarders)
  const rooms = useRoomStore((s) => s.rooms)
  const payments = usePaymentStore((s) => s.payments)

  const nowMonth = new Date().toISOString().slice(0, 7)
  const currentMonthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  const previousMonthDate = new Date()
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1)
  const previousMonthKey = previousMonthDate.toISOString().slice(0, 7)
  const previousMonthLabel = previousMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const monthlyIncomeReport = payments.reduce<Record<string, number>>((acc, payment) => {
    const month = payment.date?.slice(0, 7) || nowMonth
    acc[month] = (acc[month] || 0) + payment.amount
    return acc
  }, {})

  const pendingDuesReport = boarders.map((b) => {
    const room = rooms.find((r) => r.id === b.room || r.roomNumber === b.room)
    const roomPrice = room?.price || 0
    const paid = payments.filter((p) => p.boarderId === b.id).reduce((s, p) => s + p.amount, 0)
    return { id: b.id, name: b.name, room: b.room, monthlyRent: roomPrice, paid, due: Math.max(0, roomPrice - paid) }
  })

  const occupancyReport = rooms.map((r) => ({ id: r.id, name: r.name, roomNumber: r.roomNumber, capacity: r.capacity, occupied: r.occupied, occupancyRate: r.capacity ? Math.round((r.occupied / r.capacity) * 100) : 0 }))

  const reports: Report[] = [
    {
      id: 'RPT-BOARDERS',
      name: 'Boarder Roster',
      type: 'Guest',
      period: currentMonthLabel,
      status: boarders.length ? 'Completed' : 'Pending',
      generatedDate: boarders.length ? new Date().toISOString().slice(0, 10) : '',
      fileSize: `${Math.max(1, Math.round(boarders.length * 0.25))}.0 MB`,
    },
    {
      id: 'RPT-PAYMENTS',
      name: 'Payment Summary',
      type: 'Financial',
      period: currentMonthLabel,
      status: payments.length ? 'Completed' : 'Pending',
      generatedDate: payments.length ? new Date().toISOString().slice(0, 10) : '',
      fileSize: `${Math.max(1, Math.round(payments.length * 0.15))}.0 MB`,
    },
    {
      id: 'RPT-OCCUPANCY',
      name: 'Occupancy Overview',
      type: 'Occupancy',
      period: currentMonthLabel,
      status: rooms.length ? 'Completed' : 'Pending',
      generatedDate: rooms.length ? new Date().toISOString().slice(0, 10) : '',
      fileSize: `${Math.max(1, Math.round(rooms.length * 0.2))}.0 MB`,
    },
  ]

  const totalBoarders = boarders.length
  const occupiedRooms = rooms.filter((room) => room.occupied > 0).length
  const availableRooms = rooms.filter((room) => room.occupied < room.capacity).length

  const monthlyIncome = payments
    .filter((payment) => payment.date && payment.date.slice(0,7) === nowMonth)
    .reduce((sum, payment) => sum + payment.amount, 0)

  const boarderDues = boarders.map((boarder) => {
    const room = rooms.find((r) => r.id === boarder.room || r.roomNumber === boarder.room)
    const roomPrice = room?.price || 0
    const paid = payments
      .filter((payment) => payment.boarderId === boarder.id)
      .reduce((sum, payment) => sum + payment.amount, 0)
    return Math.max(0, roomPrice - paid)
  })

  const totalPendingDues = boarderDues.reduce((sum, due) => sum + due, 0)
  const boardersWithDues = boarderDues.filter((due) => due > 0).length

  const monthlyRef = React.useRef<HTMLDivElement | null>(null)
  const pendingRef = React.useRef<HTMLDivElement | null>(null)
  const occupancyRef = React.useRef<HTMLDivElement | null>(null)
  const collectionRef = React.useRef<HTMLDivElement | null>(null)
  const location = useLocation()

  useEffect(() => {
    const state = location.state as any
    if (!state) return
    const section = state.section
    if (section === 'monthly-income') monthlyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (section === 'pending-dues') pendingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (section === 'occupancy') occupancyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (section === 'collection') collectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [location.state])

  const summaryMetrics = [
    { label: 'Total Boarders', value: String(totalBoarders), change: `${boardersWithDues} with dues`, icon: PieChart, accent: 'from-indigo-500 to-sky-500' },
    { label: 'Occupied Rooms', value: String(occupiedRooms), change: `${availableRooms} available`, icon: BarChart3, accent: 'from-emerald-500 to-teal-500' },
    { label: 'Monthly Income', value: `৳${monthlyIncome}`, change: `${currentMonthLabel}`, icon: TrendingUp, accent: 'from-sky-500 to-indigo-500' },
    { label: 'Pending Dues', value: `৳${totalPendingDues}`, change: `${boardersWithDues} boarders owed`, icon: Download, accent: 'from-violet-500 to-fuchsia-500' },
  ]

  const keyMetrics = [
    { metric: 'Total Boarders', value: String(totalBoarders), trend: `${boardersWithDues} with dues` },
    { metric: 'Occupied Rooms', value: String(occupiedRooms), trend: `${availableRooms} available` },
    { metric: 'Monthly Income', value: `৳${monthlyIncome}`, trend: `${payments.filter((payment) => payment.date?.slice(0,7) === nowMonth).length} payments` },
    { metric: 'Pending Dues', value: `৳${totalPendingDues}`, trend: `${boardersWithDues} boarders` },
  ]

  const previousIncome = monthlyIncomeReport[previousMonthKey] || 0
  const incomeChangePercent = previousIncome > 0 ? ((monthlyIncome - previousIncome) / previousIncome) * 100 : 0
  const comparisonMonths = [
    { month: previousMonthLabel, revenue: `৳${previousIncome}`, change: previousIncome ? Number((((monthlyIncome - previousIncome) / previousIncome) * 100).toFixed(1)) : 0 },
    { month: currentMonthLabel, revenue: `৳${monthlyIncome}`, change: incomeChangePercent > 0 ? Number(incomeChangePercent.toFixed(1)) : Number((incomeChangePercent || 0).toFixed(1)) },
  ]

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
          <button onClick={() => showToast('Report generation is not available in preview')} className="inline-flex items-center gap-2 rounded-3xl bg-linear-to-r from-violet-500 to-fuchsia-500 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:shadow-lg hover:shadow-violet-500/50">
            <BarChart3 className="h-5 w-5" />
            Generate Report
          </button>
        </div>

        {/* Analytics cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryMetrics.map((stat) => {
            const Icon = stat.icon
            const onClick = () => {
              if (stat.label === 'Monthly Income') monthlyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              else if (stat.label === 'Pending Dues') pendingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              else if (stat.label === 'Occupied Rooms') occupancyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              else collectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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

      {/* Quick jump targets for metrics */}
      <section className="space-y-6">
        <div ref={monthlyRef} className="rounded-[12px] p-2" />
        <div ref={pendingRef} className="rounded-[12px] p-2" />
        <div ref={occupancyRef} className="rounded-[12px] p-2" />
        <div ref={collectionRef} className="rounded-[12px] p-2" />
      </section>

      {/* Filters */}
      <section className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-3">
          <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-medium text-slate-300 transition hover:bg-slate-800">
            <Calendar className="h-5 w-5" />
            Date Range
          </button>
          <button onClick={() => showToast('Report type filtering is not available in preview')} className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-medium text-slate-300 transition hover:bg-slate-800">
            <Filter className="h-5 w-5" />
            Report Type
          </button>
          <div className="flex-1" />
          <button onClick={() => showToast('Use the CSV export buttons for actual exports')} className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-medium text-slate-300 transition hover:bg-slate-800">
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
      {boarders.length === 0 || payments.length === 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {boarders.length === 0 ? (
            <div className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 text-slate-400">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">No boarders</p>
              <h3 className="mt-3 text-xl font-semibold text-white">Boarder data is empty</h3>
              <p className="mt-2 text-sm">Add boarders to enable occupancy and dues reports.</p>
            </div>
          ) : null}
          {payments.length === 0 ? (
            <div className="rounded-[28px] border border-slate-800/70 bg-slate-900/90 p-6 text-slate-400">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">No payments</p>
              <h3 className="mt-3 text-xl font-semibold text-white">Financial reports are empty</h3>
              <p className="mt-2 text-sm">Record payments to generate monthly income and dues summaries.</p>
            </div>
          ) : null}
        </div>
      ) : null}
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
            {keyMetrics.map((item) => (
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
            {comparisonMonths.map((item) => (
              <div key={item.month}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-slate-300">{item.month}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">{item.revenue}</p>
                    {Number(item.change) >= 0 ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300">
                        <ArrowUp className="h-3 w-3" /> {Math.abs(item.change)}%
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
                    style={{ width: `${Math.min((parseFloat(item.revenue.replace(/[^\d.]/g, '')) / 70000) * 100, 100)}%` }}
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
