import React from 'react'
import type { Boarder } from '../../types'
import { useRoomStore } from '../../store/roomStore'
import { normalizeBoarderStatus } from '../../utils/boarderLedger'

export default function BoarderForm({ initial, onSubmit }: { initial?: Partial<Boarder>; onSubmit: (b: Boarder) => void }) {
  const rooms = useRoomStore((s) => s.rooms)
  const [state, setState] = React.useState<Partial<Boarder>>(initial || {})

  const handle = (k: keyof Boarder, v: any) => setState((s) => ({ ...s, [k]: v }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = (state.id as string) || `B-${Date.now()}`
    const boarder: Boarder = {
      id,
      name: state.name || '',
      email: state.email || '',
      phone: state.phone || '',
      room: state.room || '',
      status: normalizeBoarderStatus(state.status as string) || 'ACTIVE',
      checkIn: state.checkIn || '',
      checkOut: state.checkOut || '',
      roomHistory: (state.roomHistory as string[]) || initial?.roomHistory || [],
      archived: state.archived ?? initial?.archived,
    }
    onSubmit(boarder)
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Name" value={state.name || ''} onChange={(e) => handle('name', e.target.value)} />
      <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Phone" value={state.phone || ''} onChange={(e) => handle('phone', e.target.value)} />
      <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Email" value={state.email || ''} onChange={(e) => handle('email', e.target.value)} />
      <select className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" value={state.room || ''} onChange={(e) => handle('room', e.target.value)}>
        <option value="">Unassigned</option>
        {rooms.map((r) => (
          <option key={r.id} value={r.id}>{r.roomNumber}</option>
        ))}
      </select>
      <select className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" value={(state.status as string) || 'ACTIVE'} onChange={(e) => handle('status', e.target.value)}>
        <option value="ACTIVE">Active</option>
        <option value="BOOKED">Booked</option>
        <option value="CHECKED_OUT">Checked-out</option>
        <option value="CLOSED">Closed</option>
      </select>
      <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" type="date" value={state.checkIn || ''} onChange={(e) => handle('checkIn', e.target.value)} />
      <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" type="date" value={state.checkOut || ''} onChange={(e) => handle('checkOut', e.target.value)} />
      <div className="sm:col-span-2 flex justify-end gap-2">
        <button type="submit" className="rounded-2xl bg-emerald-500/20 px-4 py-2 text-emerald-300">Save</button>
      </div>
    </form>
  )
}
