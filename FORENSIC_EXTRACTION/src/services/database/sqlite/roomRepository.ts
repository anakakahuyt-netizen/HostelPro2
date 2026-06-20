import type { Room } from '../../../types'
import * as databaseAdapter from '../databaseAdapter'

// This repository is a preparation layer for SQLite.
// Future versions will use prepared statements and a real SQLite connection.
export class RoomRepository {
  getAll(): Room[] {
    return databaseAdapter.getRooms()
  }

  getById(id: string): Room | undefined {
    return this.getAll().find((room) => room.id === id)
  }

  create(room: Room): void {
    const rooms = [room, ...this.getAll()]
    this.saveAll(rooms)
  }

  update(id: string, patch: Partial<Room>): void {
    const rooms = this.getAll().map((room) => (room.id === id ? { ...room, ...patch } : room))
    this.saveAll(rooms)
  }

  remove(id: string): void {
    const rooms = this.getAll().filter((room) => room.id !== id)
    this.saveAll(rooms)
  }

  saveAll(rooms: Room[]): void {
    databaseAdapter.saveRooms(rooms)
  }
}
