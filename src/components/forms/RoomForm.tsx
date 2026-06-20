/*
 * ARCHITECTURE LOCK - HostelPro V1.2
 * RoomForm layout and fields are part of the stable UI. Do not change visible fields or behavior.
 * This top comment documents allowed edits: comments or non-functional type hints only.
 */

import React from 'react'
import type { Room } from '../../types'

export default function RoomForm({ initial, onSubmit }: { initial?: Partial<Room>; onSubmit: (r: Room) => void }) {
  const [state, setState] = React.useState<Partial<Room>>(initial || {})
  const handle = (k: keyof Room, v: any) => setState((s) => ({ ...s, [k]: v }))

  const getCapacityForType = (type: Room['type']): number => {
    const capacities: Record<Room['type'], number> = {
      'Single': 1,
      'Double': 2,
      'Triple': 3,
      'Quad': 4,
    }
    return capacities[type] || 1
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = (state.id as string) || crypto.randomUUID()
    const type = (state.type as Room['type']) || 'Single'
    const roomNumber = state.roomNumber || initial?.roomNumber || ''
    const roomName = (state.name as string) || initial?.name || ''
    const room: Room = {
      id,
      roomNumber,
      name: roomName,
      type,
      floor: Number(state.floor || 1),
      capacity: getCapacityForType(type),
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
      <select className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" value={(state.type as string) || 'Single'} onChange={(e) => handle('type', e.target.value)}>
        <option>Single</option>
        <option>Double</option>
        <option>Triple</option>
        <option>Quad</option>
      </select>
      <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Monthly Rent" type="number" value={state.price || ''} onChange={(e) => handle('price', Number(e.target.value))} />
      <div className="sm:col-span-2 flex justify-end gap-2">
        <button type="submit" className="rounded-2xl bg-emerald-500/20 px-4 py-2 text-emerald-300">Save</button>
      </div>
    </form>
  )
}
