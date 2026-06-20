/*
 * ARCHITECTURE LOCK - HostelPro V1.2
 * BoarderForm visible/advanced sections are locked; do not change field visibility or defaults.
 * Only add comments or type-only changes if needed.
 */

import React from 'react'
import type { Boarder } from '../../types'
import { useRoomStore } from '../../store/roomStore'
import { normalizeBoarderStatus } from '../../utils/boarderLedger'
import { getTodayDate } from '../../utils/dateUtils'

export default function BoarderForm({ initial, onSubmit }: { initial?: Partial<Boarder>; onSubmit: (b: Boarder, currentPayment?: number) => void }) {
  const rooms = useRoomStore((s) => s.rooms)
  const [state, setState] = React.useState<Partial<Boarder>>(initial || {})
  const [showAdvanced, setShowAdvanced] = React.useState(false)
  const [currentPayment, setCurrentPayment] = React.useState<number>(0)
  const isAddMode = initial === undefined
  const currentStatus = (state.status as string) || 'ACTIVE'
  const isActive = currentStatus === 'ACTIVE'
  const isBooked = currentStatus === 'BOOKED'

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
    const status = normalizeBoarderStatus(state.status as string) || 'ACTIVE'
    const today = getTodayDate()
    const room = rooms.find((r) => r.id === (state.room || '') || r.roomNumber === (state.room || ''))
    const monthlyRent = Number(state.monthlyRent || room?.price || 0)
    const openingDue = status === 'BOOKED' ? 0 : Number(state.openingDue || 0)
    const advanceAmount = Number(state.advanceBalance || 0)
    const advanceBalance = !isAddMode
      ? advanceAmount
      : status === 'ACTIVE'
        ? 0
        : advanceAmount

    const boarder: Boarder = {
      id,
      name: state.name || '',
      email: state.email || '',
      phone: state.phone || '',
      room: state.room || '',
      monthlyRent,
      status,
      checkIn: state.checkIn || today,
      checkOut: state.checkOut || '',
      moveInMonth: state.moveInMonth || '',
      openingDue,
      advanceBalance,
      notes: state.notes || '',
      roomHistory: (state.roomHistory as string[]) || initial?.roomHistory || [],
      archived: state.archived ?? initial?.archived,
    }
    onSubmit(boarder, isAddMode ? currentPayment : undefined)
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      {/* Add Mode: All fields visible, no advanced toggle */}
      {isAddMode && (
        <>
          <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Name" value={state.name || ''} onChange={(e) => handle('name', e.target.value)} required />
          <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Phone" type="tel" value={state.phone || ''} onChange={(e) => handle('phone', e.target.value)} />
          <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Email" type="email" value={state.email || ''} onChange={(e) => handle('email', e.target.value)} />
          <select className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" value={state.room || ''} onChange={(e) => handleRoomChange(e.target.value)}>
            <option value="">Assign Room</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name} — {r.roomNumber}</option>
            ))}
          </select>
          <select className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" value={(state.status as string) || 'ACTIVE'} onChange={(e) => handle('status', e.target.value)}>
            <option value="ACTIVE">Active</option>
            <option value="BOOKED">Booked</option>
          </select>

          {isActive && (
            <>
              <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Opening Due" type="number" value={state.openingDue || ''} onChange={(e) => handle('openingDue', Number(e.target.value))} />
              <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Current Payment" type="number" value={currentPayment} onChange={(e) => setCurrentPayment(Number(e.target.value))} />
            </>
          )}

          {isBooked && (
            <>
              <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Activation Month" type="month" value={state.moveInMonth || ''} onChange={(e) => handle('moveInMonth', e.target.value)} />
              <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Advance Amount" type="number" value={state.advanceBalance || ''} onChange={(e) => handle('advanceBalance', Number(e.target.value))} />
            </>
          )}
        </>
      )}

      {/* Edit Mode: Show Name, Phone, Email, Room, Status + Advanced toggle for dates/notes */}
      {!isAddMode && (
        <>
          <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Name" value={state.name || ''} onChange={(e) => handle('name', e.target.value)} />
          <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Phone" value={state.phone || ''} onChange={(e) => handle('phone', e.target.value)} />
          <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Email" value={state.email || ''} onChange={(e) => handle('email', e.target.value)} />
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

          {isActive && (
            <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Opening Due" type="number" value={state.openingDue || ''} onChange={(e) => handle('openingDue', Number(e.target.value))} />
          )}

          {isBooked && (
            <>
              <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Activation Month" type="text" value={state.moveInMonth || ''} onChange={(e) => handle('moveInMonth', e.target.value)} />
              <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Advance Balance" type="number" value={state.advanceBalance || ''} onChange={(e) => handle('advanceBalance', Number(e.target.value))} />
            </>
          )}

          <button type="button" onClick={() => setShowAdvanced((value) => !value)} className="sm:col-span-2 rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4 text-left text-slate-100 transition hover:bg-slate-800">
            {showAdvanced ? 'Hide' : 'Show'} advanced fields
          </button>
          {showAdvanced && (
            <>
              <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" type="date" placeholder="Check-in" value={state.checkIn || ''} onChange={(e) => handle('checkIn', e.target.value)} />
              <input className="rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" type="date" placeholder="Check-out" value={state.checkOut || ''} onChange={(e) => handle('checkOut', e.target.value)} />
              <textarea className="sm:col-span-2 rounded-2xl border border-slate-700 bg-slate-950 py-3 px-4" placeholder="Notes" value={state.notes || ''} onChange={(e) => handle('notes', e.target.value)} />
            </>
          )}
        </>
      )}

      <div className="sm:col-span-2 flex justify-end gap-2">
        <button type="submit" className="rounded-2xl bg-emerald-500/20 px-4 py-2 text-emerald-300">Save</button>
      </div>
    </form>
  )
}
