import express from 'express'
import { client, db } from '../index'

const UserRouter = express.Router()

UserRouter.get('/user-info', (req, res) => {
    // use discord id or josephcoin id(?) to get a user's info such as balance, transaction history, etc.
    client.connect(async () => {
        const usersCollection = db.collection('Users')
        // const user = req.query.discordId
        //     ? await usersCollection.findOne({ discordId: req.query.discordId })
        //     : await usersCollection.findOne({ josephcoinId: req.query.josephcoinId });
        const user = await usersCollection.findOne({ josephcoinId: Number(req.query.josephcoinId) })
        console.log(req.query.josephcoinId)
        res.send({ user })
    })
})

UserRouter.post('/create-user', (req, res) => {
    // use discord id to create a new user with the default everything and a new josephcoin id maybe (probably incremental)
    client.connect(async () => {
        const usersCollection = db.collection('Users')
        const nextId = await usersCollection.estimatedDocumentCount()
        const insertResult = await usersCollection.insertOne({
            discordId: req.body.discordId,
            josephcoinId: nextId,
            balance: 0,
            transactions: []
        })
        const result = await usersCollection.findOne({ _id: insertResult.insertedId })

        res.send(result)
    })
})

export default UserRouter
