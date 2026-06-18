export type BoarderStatus = 'ACTIVE' | 'BOOKED' | 'CHECKED_OUT' | 'CLOSED'

export type BoarderRoomHistoryEntry = { roomNumber: string; price: number } | string

export interface Boarder {
  id: string
  name: string
  email: string
  phone: string
  room: string
  status: BoarderStatus
  checkIn: string
  checkOut: string
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
