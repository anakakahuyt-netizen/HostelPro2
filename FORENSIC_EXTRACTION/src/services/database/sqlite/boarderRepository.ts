import type { Boarder } from '../../../types'
import * as databaseAdapter from '../databaseAdapter'

// This repository is a preparation layer for SQLite.
// Future versions will use prepared statements and a real SQLite connection.
export class BoarderRepository {
  getAll(): Boarder[] {
    return databaseAdapter.getBoarders()
  }

  getById(id: string): Boarder | undefined {
    return this.getAll().find((boarder) => boarder.id === id)
  }

  create(boarder: Boarder): void {
    const boarders = [boarder, ...this.getAll()]
    this.saveAll(boarders)
  }

  update(id: string, patch: Partial<Boarder>): void {
    const boarders = this.getAll().map((boarder) =>
      boarder.id === id ? { ...boarder, ...patch } : boarder,
    )
    this.saveAll(boarders)
  }

  remove(id: string): void {
    const boarders = this.getAll().filter((boarder) => boarder.id !== id)
    this.saveAll(boarders)
  }

  saveAll(boarders: Boarder[]): void {
    databaseAdapter.saveBoarders(boarders)
  }
}
