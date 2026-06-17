import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { getUserDataPath } from '../config/appConfig.js';
let database = null;
function getDatabaseFilePath() {
    const userDataPath = getUserDataPath();
    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
    }
    return path.join(userDataPath, 'hostelpro.db');
}
function prepareSchema(db) {
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
  `);
}
export function initializeDatabase() {
    if (database)
        return;
    const dbPath = getDatabaseFilePath();
    database = new Database(dbPath);
    database.pragma('journal_mode = WAL');
    database.pragma('foreign_keys = ON');
    prepareSchema(database);
}
export function openDatabase() {
    if (!database) {
        initializeDatabase();
    }
    return database;
}
export function closeDatabase() {
    if (database) {
        database.close();
    }
    database = null;
}
export function isDatabaseReady() {
    return database !== null;
}
export function getDatabase() {
    if (!database) {
        throw new Error('Database has not been initialized');
    }
    return database;
}
export function migrateLocalStorage(boarders, rooms, payments) {
    const db = getDatabase();
    const boarderResult = db.prepare('SELECT COUNT(1) AS count FROM boarders').get();
    const roomResult = db.prepare('SELECT COUNT(1) AS count FROM rooms').get();
    const paymentResult = db.prepare('SELECT COUNT(1) AS count FROM payments').get();
    if (boarderResult.count > 0 || roomResult.count > 0 || paymentResult.count > 0) {
        return false;
    }
    const insertBoarder = db.prepare(`INSERT INTO boarders (id, name, email, phone, room, monthlyRent, status, checkIn, checkOut)
     VALUES (@id, @name, @email, @phone, @room, @monthlyRent, @status, @checkIn, @checkOut)`);
    const insertRoom = db.prepare(`INSERT INTO rooms (id, roomNumber, name, type, floor, capacity, occupied, price, status, amenities)
     VALUES (@id, @roomNumber, @name, @type, @floor, @capacity, @occupied, @price, @status, @amenities)`);
    const insertPayment = db.prepare(`INSERT INTO payments (id, boarderId, guest, room, amount, date, dueDate, status, method, notes)
     VALUES (@id, @boarderId, @guest, @room, @amount, @date, @dueDate, @status, @method, @notes)`);
    const transaction = db.transaction(() => {
        for (const boarder of boarders || []) {
            insertBoarder.run({
                id: String(boarder.id),
                name: String(boarder.name || ''),
                email: String(boarder.email || ''),
                phone: String(boarder.phone || ''),
                room: String(boarder.room || ''),
                monthlyRent: Number(boarder.monthlyRent || 0),
                status: String(boarder.status || ''),
                checkIn: String(boarder.checkIn || ''),
                checkOut: String(boarder.checkOut || ''),
            });
        }
        for (const room of rooms || []) {
            insertRoom.run({
                id: String(room.id),
                roomNumber: String(room.roomNumber || ''),
                name: room.name ?? null,
                type: String(room.type || ''),
                floor: Number(room.floor || 0),
                capacity: Number(room.capacity || 0),
                occupied: Number(room.occupied || 0),
                price: Number(room.price || 0),
                status: String(room.status || ''),
                amenities: JSON.stringify(room.amenities || []),
            });
        }
        for (const payment of payments || []) {
            insertPayment.run({
                id: String(payment.id),
                boarderId: String(payment.boarderId || ''),
                guest: String(payment.guest || ''),
                room: String(payment.room || ''),
                amount: Number(payment.amount || 0),
                date: String(payment.date || ''),
                dueDate: String(payment.dueDate || ''),
                status: String(payment.status || ''),
                method: String(payment.method || ''),
                notes: payment.notes ?? null,
            });
        }
    });
    transaction();
    return true;
}
//# sourceMappingURL=databaseService.js.map