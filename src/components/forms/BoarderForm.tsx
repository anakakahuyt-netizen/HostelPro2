/*
 * ARCHITECTURE LOCK - HostelPro V1.2
 * BoarderForm visible/advanced sections are locked; do not change field visibility or defaults.
 * Only add comments or type-only changes if needed.
 */

import React from 'react'
import type { Boarder } from '../../types'
import { useRoomStore } from '../../store/roomStore'
import { normalizeBoarderStatus } from '../../utils/boarderLedger'

export default function BoarderForm({ initial, onSubmit }: { initial?: Partial<Boarder>; onSubmit: (b: Boarder) => void }) {
  const rooms = useRoomStore((s) => s.rooms)
  const [state, setState] = React.useState<Partial<Boarder>>(initial || {})
  const [showAdvanced, setShowAdvanced] = React.useState(false)

  const handle = (k: keyof Boarder, v: any) => setState((s) => ({ ...s, [k]: v }))
  const handleRoomChange = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId)
    setState((s) => ({
      ...s,
      room: roomId,
      monthlyRent: room ? room.price : s.monthlyRent,
    }))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = (state.id as string) || crypto.randomUUID()
    const boarder: Boarder = {
      id,
      name: state.name || '',
      email: state.email || '',
      phone: state.phone || '',
      room: state.room || '',
      monthlyRent: Number(state.monthlyRent || 0),
      status: normalizeBoarderStatus(state.status as string) || 'ACTIVE',
      checkIn: state.checkIn || '',
      checkOut: state.checkOut || '',
      openingDue: Number(state.openingDue || 0),
      advanceBalance: Number(state.advanceBalance || 0),
      notes: state.notes || '',
      roomHistory: (state.roomHistory as string[]) || initial?.roomHistory || [],
      archived: state.archived ?? initial?.archived,
    }
    onSubmit(boarder)
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Name" value={state.name || ''} onChange={(e) => handle('name', e.target.value)} />
      <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Phone" value={state.phone || ''} onChange={(e) => handle('phone', e.target.value)} />
      <select className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" value={state.room || ''} onChange={(e) => handleRoomChange(e.target.value)}>
        <option value="">Unassigned</option>
        {rooms.map((r) => (
          <option key={r.id} value={r.id}>{r.name} — {r.roomNumber}</option>
        ))}
      </select>
      <select className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" value={(state.status as string) || 'ACTIVE'} onChange={(e) => handle('status', e.target.value)}>
        <option value="ACTIVE">Active</option>
        <option value="BOOKED">Booked</option>
        <option value="CHECKED_OUT">Checked-out</option>
        <option value="CLOSED">Closed</option>
      </select>
      <button type="button" onClick={() => setShowAdvanced((value) => !value)} className="sm:col-span-2 rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4 text-left text-slate-100 transition hover:bg-slate-800">
        {showAdvanced ? 'Hide' : 'Show'} advanced fields
      </button>
      {showAdvanced && (
        <>
          <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Opening Due" type="number" value={state.openingDue || ''} onChange={(e) => handle('openingDue', Number(e.target.value))} />
          <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Advance Balance" type="number" value={state.advanceBalance || ''} onChange={(e) => handle('advanceBalance', Number(e.target.value))} />
          <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" type="date" placeholder="Check-in" value={state.checkIn || ''} onChange={(e) => handle('checkIn', e.target.value)} />
          <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" type="date" placeholder="Check-out" value={state.checkOut || ''} onChange={(e) => handle('checkOut', e.target.value)} />
          <textarea className="sm:col-span-2 rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Notes" value={state.notes || ''} onChange={(e) => handle('notes', e.target.value)} />
        </>
      )}
      <div className="sm:col-span-2 flex justify-end gap-2">
        <button type="submit" className="rounded-2xl bg-emerald-500/20 px-4 py-2 text-emerald-300">Save</button>
      </div>
    </form>
  )
}
