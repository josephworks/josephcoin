/* eslint-disable @typescript-eslint/no-unused-vars */ // for testing
import path from 'node:path'
import { env } from 'node:process'
import colors from 'colors'
import * as dotenv from 'dotenv'
import express from 'express'
import { MongoClient } from 'mongodb'
import swaggerUi from 'swagger-ui-express'
import UserRouter from './routes/users'

colors.enable()

const app = express()

app.use(express.json())

dotenv.config()

const swaggerAutogen = require('swagger-autogen')()

const endpointFiles = [path.join(__dirname, 'index')]

const config = {
    info: {
        title: 'JosephCoin',
        description: 'JosephCoin API Documentation'
    },
    host: 'localhost:3000',
    schemes: ['http']
}

swaggerAutogen('../swagger.json', endpointFiles, config)

const swaggerDocument = require('../swagger.json')

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
// new mongodb connection (mongodb)

export const client = new MongoClient(<string>env.DB_URL)
export const db = client.db(<string>env.DB_NAME)

const max_josephcoin_amount = 20000000 // Unused for now

const router = express.Router()

client.connect(async () => {
    const bankCollection = db.collection('Bank')
    // await bankCollection.insertOne({
    //     checking: 976.60 / 2, // TODO: if less than 100, set to 0
    //     savings: 1500.03 / 2,
    //     date: new Date(),
    // });
    const josephcoinCollection = db.collection('JosephCoin')

    const usersCollection = db.collection('Users')
})

router.get('/worth', (req, res) => {
    // get the worth of an amount of josephcoin
    client.connect(async () => {
        const collection = db.collection('Bank')
        const result = await collection.findOne()
        const response = {
            worth: Number(result?.checking) + Number(result?.savings) / Number(req.query.amount)
        }
        res.send(response)
    })
})

router.post('/add-coin', (req, res) => {
    // give a user coin using discord id or josephcoin id
    client.connect(async () => {
        const usersCollection = db.collection('Users')
        const user = req.body.discordId
            ? await usersCollection.findOne({ discordId: req.body.discordId })
            : await usersCollection.findOne({ josephcoinId: req.body.josephcoinId })
        console.log(req.body.josephcoinId)
        if (!user) {
            res.send({ error: 'User not found' })
            return
        }
        const newBalance = Number(user.balance) + Number(req.body.amount)
        const _updateBalanceResult = await usersCollection.updateOne(
            { _id: user._id },
            { $set: { balance: newBalance } }
        )
        const _updateTransactionsResult = await usersCollection.updateOne(
            { _id: user._id },
            {
                $push: {
                    transactions: {
                        transaction: {
                            type: 'addition',
                            amount: req.body.amount,
                            date: new Date()
                        }
                    }
                }
            }
        )
        const _updateBank = await usersCollection.updateOne(
            { josephcoinId: 0 },
            { $inc: { balance: -req.body.amount } }
        )
        res.send({
            balance: newBalance
        })
    })
})

router.post('/subtract-coin', (req, res) => {
    // take a user's coin using discord id or josephcoin id
    client.connect(async () => {
        const usersCollection = db.collection('Users')
        const user = req.body.discordId
            ? await usersCollection.findOne({ discordId: req.body.discordId })
            : await usersCollection.findOne({ josephcoinId: req.body.josephcoinId })

        if (!user) {
            res.send({ error: 'User not found' })
            return
        }
        const newBalance = user.balance - req.body.amount
        const _updateBalanceResult = await usersCollection.updateOne(
            { _id: user._id },
            { $set: { balance: newBalance } }
        )
        const _updateTransactionsResult = await usersCollection.updateOne(
            { _id: user._id },
            {
                $push: {
                    transactions: {
                        transaction: {
                            type: 'subtraction',
                            amount: req.body.amount,
                            date: new Date()
                        }
                    }
                }
            }
        )
        const _updateBank = await usersCollection.updateOne(
            { josephcoinId: 0 },
            { $inc: { balance: req.body.amount } }
        )
        res.send({
            balance: newBalance
        })
    })
})

router.post('/trade-coin', (req, res) => {
    // trade coin between two users using discord id or josephcoin id
})

function loggerMiddleware(req: any, res: any, next: any): void {
    let oldWrite = res.write
    let oldEnd = res.end
    let chunks = []

    res.write = function (chunk: never, ...args: any) {
        chunks.push(chunk)
        return oldWrite.apply(res, args)
    }

    res.end = function (chunk: never, ...args: any) {
        if (chunk) chunks.push(chunk)
        if (typeof chunk != 'string') {
            const body = Buffer.concat(chunks).toString('utf8')

            console.log(
                `(${new Date().toLocaleTimeString()}) ${req.method} ${req.path} | ${
                    req.query ? 'Query: ' + JSON.stringify(req.query) : ''
                } ${req.body ? 'Body: ' + JSON.stringify(req.body) : ''} - ${body}`
            )
            oldEnd.apply(res, args)
        } else {
            console.log(
                `(${new Date().toLocaleTimeString()}) ${req.method} ${req.path} \n\n` +
                    '<=>=<=>=<=>=<=>=<=>=<=>=<=>=<=>\n'.rainbow +
                    '      ' +
                    'ERROR ERROR ERROR\n'.yellow.underline +
                    '<=>=<=>=<=>=<=>=<=>=<=>=<=>=<=>\n\n'.rainbow +
                    `${chunk}\n`.red +
                    '<=>=<=>=<=>=<=>=<=>=<=>=<=>=<=>\n'.rainbow +
                    '      ' +
                    'ERROR ERROR ERROR\n'.yellow.underline +
                    '<=>=<=>=<=>=<=>=<=>=<=>=<=>=<=>\n'.rainbow
            )
        }
    }

    next()
}

app.use(loggerMiddleware)

app.use('/api', router)

app.use('/api/user', UserRouter)

if (!process.env.PORT) throw new Error('Port is not defined')

app.listen(process.env.PORT, () => {
    console.log(`[!] Server started on port: ${process.env.PORT}!`)
})
