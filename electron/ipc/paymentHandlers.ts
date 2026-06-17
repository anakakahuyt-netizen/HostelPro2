import { ipcMain } from 'electron'
import { PaymentRepository } from '../../src/services/database/sqlite/paymentRepository.js'
import { GET_PAYMENTS, SAVE_PAYMENTS } from '../ipcChannels.js'

const paymentRepository = new PaymentRepository()

export function registerPaymentHandlers() {
  ipcMain.on(GET_PAYMENTS, (event) => {
    event.returnValue = paymentRepository.getAll()
  })
  ipcMain.on(SAVE_PAYMENTS, (event, payments) => {
    paymentRepository.saveAll(payments)
    event.returnValue = true
  })
}
