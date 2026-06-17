import type { Boarder, Room, Payment } from '../types'

const BOARDER_KEY = 'hostelpro_boarders'
const ROOM_KEY = 'hostelpro_rooms'
const PAYMENT_KEY = 'hostelpro_payments'

export function getBoarders(): Boarder[] {
  try {
    const raw = localStorage.getItem(BOARDER_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('getBoarders error', err)
    return []
  }
}

export function saveBoarders(boarders: Boarder[]) {
  try {
    localStorage.setItem(BOARDER_KEY, JSON.stringify(boarders))
  } catch (err) {
    console.error('saveBoarders error', err)
  }
}

export function getRooms(): Room[] {
  try {
    const raw = localStorage.getItem(ROOM_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('getRooms error', err)
    return []
  }
}

export function saveRooms(rooms: Room[]) {
  try {
    localStorage.setItem(ROOM_KEY, JSON.stringify(rooms))
  } catch (err) {
    console.error('saveRooms error', err)
  }
}

export function getPayments(): Payment[] {
  try {
    const raw = localStorage.getItem(PAYMENT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('getPayments error', err)
    return []
  }
}

export function savePayments(payments: Payment[]) {
  try {
    localStorage.setItem(PAYMENT_KEY, JSON.stringify(payments))
  } catch (err) {
    console.error('savePayments error', err)
  }
}

export default { getBoarders, saveBoarders, getRooms, saveRooms, getPayments, savePayments }
