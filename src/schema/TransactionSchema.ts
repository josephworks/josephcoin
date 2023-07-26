import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    }
})

const Transaction = mongoose.model('Transaction', transactionSchema)

export default Transaction
