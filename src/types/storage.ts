import type { Boarder, Room, Payment } from './hostel'

export interface StorageSnapshot {
  boarders: Boarder[]
  rooms: Room[]
  payments: Payment[]
}

export type { Boarder, Room, Payment }
