import mongoose from 'mongoose'

mongoose.connect('mongodb://localhost/JosephCoin')

const db = mongoose.connection

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
    console.log('Connected to MongoDB')
})

export default db
