import { defineEventHandler } from 'h3'

export default defineEventHandler(() => ({
  name: 'SPP Payment System API',
  status: 'ok',
  time: new Date().toISOString(),
}))
