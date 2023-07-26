import express, { Request, Response, NextFunction } from 'express'
import Transaction from '../schema/TransactionSchema'

const router = express.Router()

interface TransactionResponse extends Response {
    transaction?: any
}

// Get all transactions
router.get('/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find()
        res.json(transactions)
    } catch (err: any) {
        res.status(500).json({ message: err.message })
    }
})

// Get a single transaction
router.get('/transactions/:id', getTransaction, (req, res: TransactionResponse) => {
    res.json(res.transaction)
})

// Create a transaction
router.post('/transactions', async (req, res) => {
    const transaction = new Transaction({
        amount: req.body.amount,
        description: req.body.description,
        date: req.body.date
    })

    try {
        const newTransaction = await transaction.save()
        res.status(201).json(newTransaction)
    } catch (err: any) {
        res.status(400).json({ message: err.message })
    }
})

// Update a transaction
router.patch('/transactions/:id', getTransaction, async (req, res: TransactionResponse) => {
    if (req.body.amount != null) {
        res.transaction.amount = req.body.amount
    }

    if (req.body.description != null) {
        res.transaction.description = req.body.description
    }

    if (req.body.date != null) {
        res.transaction.date = req.body.date
    }

    try {
        const updatedTransaction = await res.transaction.save()
        res.json(updatedTransaction)
    } catch (err: any) {
        res.status(400).json({ message: err.message })
    }
})

// Delete a transaction
router.delete('/transactions/:id', getTransaction, async (req, res: TransactionResponse) => {
    try {
        await res.transaction.remove()
        res.json({ message: 'Deleted Transaction' })
    } catch (err: any) {
        res.status(500).json({ message: err.message })
    }
})

async function getTransaction (req: Request, res: TransactionResponse, next: NextFunction) {
    let transaction

    try {
        transaction = await Transaction.findById(req.params.id)

        if (transaction == null) {
            return res.status(404).json({ message: 'Cannot find transaction' })
        }
    } catch (err: any) {
        return res.status(500).json({ message: err.message })
    }

    res.transaction = transaction
    next()
}

export default router
