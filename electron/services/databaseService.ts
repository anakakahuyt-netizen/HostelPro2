import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import { getUserDataPath } from '../config/appConfig.js'

let database: Database.Database | null = null

function getDatabaseFilePath(): string {
  const userDataPath = getUserDataPath()
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true })
  }
  return path.join(userDataPath, 'hostelpro.db')
}

function prepareSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS boarders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      room TEXT NOT NULL,
      monthlyRent REAL NOT NULL,
      status TEXT NOT NULL,
      checkIn TEXT NOT NULL,
      checkOut TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      roomNumber TEXT UNIQUE NOT NULL,
      name TEXT,
      type TEXT NOT NULL,
      floor INTEGER NOT NULL,
      capacity INTEGER NOT NULL,
      occupied INTEGER NOT NULL,
      price REAL NOT NULL,
      status TEXT NOT NULL,
      amenities TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      boarderId TEXT NOT NULL,
      guest TEXT NOT NULL,
      room TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      status TEXT NOT NULL,
      method TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}

export function initializeDatabase(): void {
  if (database) return
  const dbPath = getDatabaseFilePath()
  database = new Database(dbPath)
  database.pragma('journal_mode = WAL')
  database.pragma('foreign_keys = ON')
  prepareSchema(database)
}

export function openDatabase(): Database.Database | null {
  if (!database) {
    initializeDatabase()
  }
  return database
}

export function closeDatabase(): void {
  if (database) {
    database.close()
  }
  database = null
}

export function isDatabaseReady(): boolean {
  return database !== null
}

export function getDatabase(): Database.Database {
  if (!database) {
    throw new Error('Database has not been initialized')
  }
  return database
}

export function migrateLocalStorage(boarders: unknown[], rooms: unknown[], payments: unknown[]): boolean {
  const db = getDatabase()
  const boarderResult = db.prepare('SELECT COUNT(1) AS count FROM boarders').get() as { count: number }
  const roomResult = db.prepare('SELECT COUNT(1) AS count FROM rooms').get() as { count: number }
  const paymentResult = db.prepare('SELECT COUNT(1) AS count FROM payments').get() as { count: number }
  if (boarderResult.count > 0 || roomResult.count > 0 || paymentResult.count > 0) {
    return false
  }

  const insertBoarder = db.prepare(
    `INSERT INTO boarders (id, name, email, phone, room, monthlyRent, status, checkIn, checkOut)
     VALUES (@id, @name, @email, @phone, @room, @monthlyRent, @status, @checkIn, @checkOut)`,
  )
  const insertRoom = db.prepare(
    `INSERT INTO rooms (id, roomNumber, name, type, floor, capacity, occupied, price, status, amenities)
     VALUES (@id, @roomNumber, @name, @type, @floor, @capacity, @occupied, @price, @status, @amenities)`,
  )
  const insertPayment = db.prepare(
    `INSERT INTO payments (id, boarderId, guest, room, amount, date, dueDate, status, method, notes)
     VALUES (@id, @boarderId, @guest, @room, @amount, @date, @dueDate, @status, @method, @notes)`,
  )

  const transaction = db.transaction(() => {
    for (const boarder of boarders || []) {
      insertBoarder.run({
        id: String((boarder as any).id),
        name: String((boarder as any).name || ''),
        email: String((boarder as any).email || ''),
        phone: String((boarder as any).phone || ''),
        room: String((boarder as any).room || ''),
        monthlyRent: Number((boarder as any).monthlyRent || 0),
        status: String((boarder as any).status || ''),
        checkIn: String((boarder as any).checkIn || ''),
        checkOut: String((boarder as any).checkOut || ''),
      })
    }

    for (const room of rooms || []) {
      insertRoom.run({
        id: String((room as any).id),
        roomNumber: String((room as any).roomNumber || ''),
        name: (room as any).name ?? null,
        type: String((room as any).type || ''),
        floor: Number((room as any).floor || 0),
        capacity: Number((room as any).capacity || 0),
        occupied: Number((room as any).occupied || 0),
        price: Number((room as any).price || 0),
        status: String((room as any).status || ''),
        amenities: JSON.stringify((room as any).amenities || []),
      })
    }

    for (const payment of payments || []) {
      insertPayment.run({
        id: String((payment as any).id),
        boarderId: String((payment as any).boarderId || ''),
        guest: String((payment as any).guest || ''),
        room: String((payment as any).room || ''),
        amount: Number((payment as any).amount || 0),
        date: String((payment as any).date || ''),
        dueDate: String((payment as any).dueDate || ''),
        status: String((payment as any).status || ''),
        method: String((payment as any).method || ''),
        notes: (payment as any).notes ?? null,
      })
    }
  })

  transaction()
  return true
}
