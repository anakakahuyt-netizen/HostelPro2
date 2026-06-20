import React from 'react'
import type { Room } from '../../types'

export default function RoomForm({ initial, onSubmit }: { initial?: Partial<Room>; onSubmit: (r: Room) => void }) {
  const [state, setState] = React.useState<Partial<Room>>(initial || {})
  const handle = (k: keyof Room, v: any) => setState((s) => ({ ...s, [k]: v }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = (state.id as string) || `R-${Date.now()}`
    const room: Room = {
      id,
      roomNumber: state.roomNumber || '',
      name: state.name || '',
      type: (state.type as Room['type']) || 'Single',
      floor: Number(state.floor || 1),
      capacity: Number(state.capacity || 1),
      occupied: Number(state.occupied || 0),
      price: Number(state.price || 0),
      status: (state.status as Room['status']) || 'Available',
      amenities: state.amenities || [],
    }
    onSubmit(room)
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Room Number" value={state.roomNumber || ''} onChange={(e) => handle('roomNumber', e.target.value)} />
      <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Name" value={state.name || ''} onChange={(e) => handle('name', e.target.value)} />
      <select className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" value={(state.type as string) || 'Single'} onChange={(e) => handle('type', e.target.value)}>
        <option>Single</option>
        <option>Double</option>
        <option>Triple</option>
        <option>Quad</option>
      </select>
      <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Floor" type="number" value={state.floor || ''} onChange={(e) => handle('floor', Number(e.target.value))} />
      <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Capacity" type="number" value={state.capacity || ''} onChange={(e) => handle('capacity', Number(e.target.value))} />
      <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Price" type="number" value={state.price || ''} onChange={(e) => handle('price', Number(e.target.value))} />
      <div className="sm:col-span-2 flex justify-end gap-2">
        <button type="submit" className="rounded-2xl bg-emerald-500/20 px-4 py-2 text-emerald-300">Save</button>
      </div>
    </form>
  )
}
