import React from 'react'
import type { Payment } from '../../types'
import type { Boarder } from '../../types'

export default function PaymentForm({ boarders, initial, onSubmit }: { boarders: Boarder[]; initial?: Partial<Payment>; onSubmit: (p: Payment) => void }) {
  const [state, setState] = React.useState<Partial<Payment>>(initial || {})
  const handle = (k: keyof Payment, v: any) => setState((s) => ({ ...s, [k]: v }))

  const selectedBoarder = boarders.find((b) => b.id === state.boarderId)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = (state.id as string) || `PAY-${Date.now()}`
    const boarder = boarders.find((b) => b.id === state.boarderId) || selectedBoarder
    const p: Payment = {
      id,
      boarderId: state.boarderId || boarders[0]?.id || '',
      guest: boarder?.name || state.guest || '',
      room: boarder?.room || state.room || '',
      amount: Number(state.amount || 0),
      date: state.date || new Date().toISOString().split('T')[0],
      dueDate: state.dueDate || '',
      status: (state.status as Payment['status']) || 'Paid',
      method: state.method || 'Card',
      notes: state.notes || '',
    }
    onSubmit(p)
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <select
        className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4"
        value={state.boarderId || ''}
        onChange={(e) => {
          const boarder = boarders.find((b) => b.id === e.target.value)
          handle('boarderId', e.target.value)
          if (boarder) {
            handle('guest', boarder.name)
            handle('room', boarder.room)
          }
        }}
      >
        {boarders.map((b) => (
          <option key={b.id} value={b.id}>{b.name} — {b.room}</option>
        ))}
      </select>
      <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Amount" type="number" value={state.amount || ''} onChange={(e) => handle('amount', Number(e.target.value))} />
      <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" type="date" value={state.date || ''} onChange={(e) => handle('date', e.target.value)} />
      <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" type="date" value={state.dueDate || ''} onChange={(e) => handle('dueDate', e.target.value)} />
      <select className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" value={state.status || 'Paid'} onChange={(e) => handle('status', e.target.value)}>
        <option>Paid</option>
        <option>Partial</option>
        <option>Due</option>
      </select>
      <select className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" value={state.method || 'Card'} onChange={(e) => handle('method', e.target.value)}>
        <option>Card</option>
        <option>Transfer</option>
        <option>Check</option>
        <option>Cash</option>
      </select>
      <textarea className="sm:col-span-2 rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4 text-slate-100" placeholder="Notes" value={state.notes || ''} onChange={(e) => handle('notes', e.target.value)} rows={4} />
      <div className="sm:col-span-2 flex justify-end gap-2">
        <button type="submit" className="rounded-2xl bg-emerald-500/20 px-4 py-2 text-emerald-300">Save</button>
      </div>
    </form>
  )
}
