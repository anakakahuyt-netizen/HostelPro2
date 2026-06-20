import React from 'react'
import type { Payment } from '../../types'
import type { Boarder } from '../../types'

export default function PaymentForm({ boarders, initial, onSubmit }: { boarders: Boarder[]; initial?: Partial<Payment>; onSubmit: (p: Payment) => void }) {
  const [state, setState] = React.useState<Partial<Payment>>(initial || {})
  const handle = (k: keyof Payment, v: any) => setState((s) => ({ ...s, [k]: v }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = (state.id as string) || `PAY-${Date.now()}`
    const p: Payment = {
      id,
      boarderId: state.boarderId || boarders[0]?.id || '',
      guest: state.guest || boarders.find((b) => b.id === state.boarderId)?.name || '',
      room: state.room || '',
      amount: Number(state.amount || 0),
      date: state.date || new Date().toISOString().split('T')[0],
      dueDate: state.dueDate || '',
      status: (state.status as Payment['status']) || 'Paid',
      method: state.method || 'Card',
    }
    onSubmit(p)
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <select className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" value={state.boarderId || ''} onChange={(e) => handle('boarderId', e.target.value)}>
        {boarders.map((b) => (
          <option key={b.id} value={b.id}>{b.name} — {b.room}</option>
        ))}
      </select>
      <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Amount" type="number" value={state.amount || ''} onChange={(e) => handle('amount', Number(e.target.value))} />
      <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" type="date" value={state.dueDate || ''} onChange={(e) => handle('dueDate', e.target.value)} />
      <select className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" value={state.method || 'Card'} onChange={(e) => handle('method', e.target.value)}>
        <option>Card</option>
        <option>Transfer</option>
        <option>Check</option>
        <option>Cash</option>
      </select>
      <div className="sm:col-span-2 flex justify-end gap-2">
        <button type="submit" className="rounded-2xl bg-emerald-500/20 px-4 py-2 text-emerald-300">Save</button>
      </div>
    </form>
  )
}
