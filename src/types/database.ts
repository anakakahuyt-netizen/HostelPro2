import type { Boarder, Room, Payment } from './hostel'

export interface DatabaseAdapter {
  getBoarders(): Boarder[]
  saveBoarders(boarders: Boarder[]): void
  getRooms(): Room[]
  saveRooms(rooms: Room[]): void
  getPayments(): Payment[]
  savePayments(payments: Payment[]): void
}

export interface SqliteAdapter extends DatabaseAdapter {
  // Future SQLite-specific methods can be added here.
}
