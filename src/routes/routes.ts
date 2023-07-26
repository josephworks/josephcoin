import express from 'express'

const router = express.Router()

// call midleware
router.use(express.json())

// User routes
router.use('/users', require('./users'))

// Transaction routes
router.use('/transactions', require('./transactions'))

export default router
