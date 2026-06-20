export type BoarderStatus = 'ACTIVE' | 'BOOKED' | 'CHECKED_OUT' | 'CLOSED'

export type BoarderRoomHistoryEntry = { roomNumber: string; price: number } | string

export interface Boarder {
  id: string
  name: string
  email: string
  phone: string
  room: string
  monthlyRent?: number
  status: BoarderStatus
  checkIn: string
  checkOut: string
  moveInMonth?: string
  checkoutMonth?: string
  advanceAmount?: number
  // Persisted opening and current month dues from CSV import
  openingDue?: number
  currentMonthDue?: number
  // Persisted advance balance (new preferred field). Backwards-compatible with `advanceAmount`.
  advanceBalance?: number
  // Optional free-form notes for the boarder
  notes?: string
  roomHistory?: BoarderRoomHistoryEntry[]
  archived?: boolean
}

export type RoomStatus = 'Available' | 'Occupied' | 'Limited' | 'Maintenance'

export interface Room {
  id: string
  roomNumber: string
  name?: string
  type: 'Single' | 'Double' | 'Triple' | 'Quad'
  floor: number
  capacity: number
  occupied: number
  price: number
  status: RoomStatus
  amenities: string[]
}

export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue' | 'Partial' | 'Due' | 'Advance'

export interface Payment {
  id: string
  boarderId: string
  guest: string
  room: string
  amount: number
  date: string
  dueDate: string
  status: PaymentStatus
  method: string
  notes?: string
}
