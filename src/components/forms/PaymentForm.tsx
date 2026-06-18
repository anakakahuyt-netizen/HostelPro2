import React from 'react'
import type { Payment } from '../../types'
import type { Boarder, Room } from '../../types'

function formatPaymentId(date: string, roomNumber: string, existingIds: string[], currentId?: string) {
  const parsed = new Date(date || '')
  const sourceDate = Number.isNaN(parsed.getTime()) ? new Date() : parsed
  const day = String(sourceDate.getDate()).padStart(2, '0')
  const month = String(sourceDate.getMonth() + 1).padStart(2, '0')
  const year = String(sourceDate.getFullYear())
  const normalizedRoom = roomNumber.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'ROOM'
  const baseId = `PAY-${day}${month}${year}${normalizedRoom}`
  let candidate = baseId
  let suffix = 1
  while (existingIds.includes(candidate) && candidate !== currentId) {
    suffix += 1
    candidate = `${baseId}-${suffix}`
  }
  return candidate
}

export default function PaymentForm({ boarders, rooms, payments, initial, onSubmit }: { boarders: Boarder[]; rooms: Room[]; payments: Payment[]; initial?: Partial<Payment>; onSubmit: (p: Payment) => void }) {
  const [state, setState] = React.useState<Partial<Payment>>(initial || {})
  const handle = (k: keyof Payment, v: any) => setState((s) => ({ ...s, [k]: v }))

  const selectedBoarder = boarders.find((b) => b.id === state.boarderId)

  const calculateStatus = (amount: number, roomPrice: number | undefined): Payment['status'] => {
    const price = roomPrice || 0
    if (amount >= price) return 'Paid'
    if (amount > 0) return 'Partial'
    return 'Due'
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const boarder = boarders.find((b) => b.id === state.boarderId) || selectedBoarder
    const room = rooms.find((r) => r.id === boarder?.room || r.roomNumber === boarder?.room)
    const amount = Number(state.amount || 0)
    const roomNumber = room?.roomNumber || String(boarder?.room || state.room || '')
    const existingIds = payments.map((payment) => payment.id)
    const currentId = typeof state.id === 'string' ? state.id : undefined
    const id = currentId || formatPaymentId(state.date || new Date().toISOString().split('T')[0], roomNumber, existingIds, currentId)
    const p: Payment = {
      id,
      boarderId: state.boarderId || boarders[0]?.id || '',
      guest: boarder?.name || state.guest || '',
      room: roomNumber,
      amount,
      date: state.date || new Date().toISOString().split('T')[0],
      dueDate: state.dueDate || '',
      status: calculateStatus(amount, room?.price),
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
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
      <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Amount" type="number" value={state.amount || ''} onChange={(e) => handle('amount', Number(e.target.value))} />
      <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" type="date" value={state.date || ''} onChange={(e) => handle('date', e.target.value)} />
      <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" type="date" value={state.dueDate || ''} onChange={(e) => handle('dueDate', e.target.value)} />
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
