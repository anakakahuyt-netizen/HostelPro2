import type { Boarder, Room, Payment } from './hostel'

export interface BoarderApi {
  getAll(): Boarder[]
  saveAll(boarders: Boarder[]): void
  add(boarder: Boarder): void
  update(id: string, patch: Partial<Boarder>): void
  remove(id: string): void
}

export interface RoomApi {
  getAll(): Room[]
  saveAll(rooms: Room[]): void
  add(room: Room): void
  update(id: string, patch: Partial<Room>): void
  remove(id: string): void
}

export interface PaymentApi {
  getAll(): Payment[]
  saveAll(payments: Payment[]): void
  add(payment: Payment): void
  update(id: string, patch: Partial<Payment>): void
  remove(id: string): void
}
