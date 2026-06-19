/*
 * ARCHITECTURE LOCK - HostelPro V1.2
 * Payment form behavior and payment logic are locked. Do not alter calculation or ID generation.
 * Allowed edits: comments, documentation, or type annotations only.
 */

import React from 'react'
import { computePaymentStatus } from '../../store/paymentStore'
import type { Payment } from '../../types'
import type { Boarder, Room } from '../../types'
import { getTodayDate } from '../../utils/dateUtils'

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
  const [showAdvanced, setShowAdvanced] = React.useState(false)
  const handle = (k: keyof Payment, v: any) => setState((s) => ({ ...s, [k]: v }))

  const selectedBoarder = boarders.find((b) => b.id === state.boarderId)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const boarder = boarders.find((b) => b.id === state.boarderId) || selectedBoarder
    const room = rooms.find((r) => r.id === boarder?.room || r.roomNumber === boarder?.room)
    const amount = Number(state.amount || 0)
    const roomNumber = room?.roomNumber || String(boarder?.room || state.room || '')
    const existingIds = payments.map((payment) => payment.id)
    const currentId = typeof state.id === 'string' ? state.id : undefined
    const id = currentId || formatPaymentId(state.date || getTodayDate(), roomNumber, existingIds, currentId)
    const p: Payment = {
      id,
      boarderId: state.boarderId || boarders[0]?.id || '',
      guest: boarder?.name || state.guest || '',
      room: roomNumber,
      amount,
      date: state.date || getTodayDate(),
      dueDate: '',
      status: 'Pending',
      method: state.method || 'Cash',
      notes: state.notes || '',
    }
    p.status = computePaymentStatus(p, rooms, boarders)
    onSubmit(p)
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <label className="sm:col-span-2">
        <div className="mb-1 font-semibold">Boarder</div>
        <select
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4"
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
      </label>

      <label>
        <div className="mb-1 font-semibold">Amount</div>
        <input className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" type="number" value={state.amount || ''} onChange={(e) => handle('amount', Number(e.target.value))} />
      </label>

      <button type="button" onClick={() => setShowAdvanced((value) => !value)} className="sm:col-span-2 rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4 text-left text-slate-100 transition hover:bg-slate-800">
        {showAdvanced ? 'Hide' : 'Show'} advanced fields
      </button>

      {showAdvanced && (
        <>
          <label>
            <div className="mb-1 font-semibold">Payment Date</div>
            <input className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" type="date" value={state.date || getTodayDate()} onChange={(e) => handle('date', e.target.value)} />
          </label>

          <label>
            <div className="mb-1 font-semibold">Payment Method</div>
            <select className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" value={state.method || 'Cash'} onChange={(e) => handle('method', e.target.value)}>
              <option>Cash</option>
              <option>Card</option>
              <option>Transfer</option>
              <option>Check</option>
            </select>
          </label>

          <label className="sm:col-span-2">
            <div className="mb-1 font-semibold">Notes</div>
            <textarea className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4 text-slate-100" value={state.notes || ''} onChange={(e) => handle('notes', e.target.value)} rows={4} />
          </label>
        </>
      )}

      <div className="sm:col-span-2 flex justify-end gap-2">
        <button type="submit" className="rounded-2xl bg-emerald-500/20 px-4 py-2 text-emerald-300">Save</button>
      </div>
    </form>
  )
}
