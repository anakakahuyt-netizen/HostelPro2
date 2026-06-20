import { app } from 'electron'

export const isDev = process.env.TEST === 'true' || process.env.NODE_ENV === 'development' || !app.isPackaged
