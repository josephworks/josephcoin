/* eslint-disable @typescript-eslint/no-unused-vars */ // for testing
import path from 'node:path'
import { env } from 'node:process'
import colors from 'colors'
// @ts-ignore
import * as dotenv from 'dotenv'
import express from 'express'
import { MongoClient } from 'mongodb'
import swaggerUi from 'swagger-ui-express'
import UserRouter from './routes/users'
Error.stackTraceLimit = Infinity

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
let bankUser

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
// new mongodb connection (mongodb)

export const client = new MongoClient(<string>env.DB_URL)
export const db = client.db(<string>env.DB_NAME)

const maxJosephcoinAmount = 20000000

const router = express.Router()

client.connect(async () => {
    const bankCollection = db.collection('Bank')
    const bank = await bankCollection.findOne()
    if (!bank) {
        await bankCollection.insertOne({
            checking: 976.60 / 2, // TODO: if less than 100, set to 0
            savings: 1500.03 / 2,
            date: new Date()
        })
    }

    const josephcoinCollection = db.collection('JosephCoin')

    const usersCollection = db.collection('Users')

    bankUser = await usersCollection.findOne({ josephcoinId: 0 })
    if (!bankUser) {
        await usersCollection.insertOne({
            discordId: '0',
            josephcoinId: 0,
            balance: maxJosephcoinAmount,
            transactions: []
        })
    }
})

router.get('/worth', (req, res) => {
    // get the worth of an amount of josephcoin
    client.connect(async () => {
        const collection = db.collection('Bank')
        const result = await collection.findOne()
        const response = {
            worth: (Number(result?.checking) + Number(result?.savings)) / ((maxJosephcoinAmount / 2) / Number(req.query.amount))
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
        const bankBalance = Number(bankUser.balance) - Number(req.body.amount)
        if (bankBalance < 0) {
            res.send({ error: 'Bank is out of money' })
            return
        }

        const _updateUserBalanceResult = await usersCollection.updateOne(
            { _id: user._id },
            { $set: { balance: newBalance } }
        )
        if (!_updateUserBalanceResult) {
            res.send({ error: 'Error updating user balance' })
            return
        }
        const _updateBankBalanceResult = await usersCollection.updateOne(
            { _id: bankUser._id },
            { $set: { balance: bankBalance } }
        )
        if (!_updateBankBalanceResult) {
            res.send({ error: 'Error updating bank balance' })
            return
        }
        const _updateTransactionsResult = await usersCollection.updateOne(
            { _id: user._id },
            {
                $push: {
                    transactions: {
                        transaction: {
                            type: 'recieved',
                            amount: req.body.amount,
                            from: bankUser._id,
                            date: new Date()
                        }
                    }
                }
            }
        )
        if (!_updateTransactionsResult) {
            res.send({ error: 'Error updating user transactions' })
            return
        }
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
        console.log(req.body.josephcoinId)
        if (!user) {
            res.send({ error: 'User not found' })
            return
        }
        const newBalance = Number(user.balance) - Number(req.body.amount)
        const bankBalance = Number(bankUser.balance) + Number(req.body.amount)
        if (bankBalance < 0) {
            res.send({ error: 'Bank is out of money' })
            return
        }

        const _updateUserBalanceResult = await usersCollection.updateOne(
            { _id: user._id },
            { $set: { balance: newBalance } }
        )
        if (!_updateUserBalanceResult) {
            res.send({ error: 'Error updating user balance' })
            return
        }
        const _updateBankBalanceResult = await usersCollection.updateOne(
            { _id: bankUser._id },
            { $set: { balance: bankBalance } }
        )
        if (!_updateBankBalanceResult) {
            res.send({ error: 'Error updating bank balance' })
            return
        }
        const _updateTransactionsResult = await usersCollection.updateOne(
            { _id: user._id },
            {
                $push: {
                    transactions: {
                        transaction: {
                            type: 'sent',
                            amount: req.body.amount,
                            to: bankUser._id,
                            date: new Date()
                        }
                    }
                }
            }
        )
        if (!_updateTransactionsResult) {
            res.send({ error: 'Error updating user transactions' })
            return
        }
        res.send({
            balance: newBalance
        })
    })
})

router.post('/trade-coin', (req, res) => {
    // trade coin between two users using discord id or josephcoin id
    client.connect(async () => {
        const usersCollection = db.collection('Users')
        const from = req.body.fromDiscordId
            ? await usersCollection.findOne({ discordId: req.body.fromDiscordId })
            : await usersCollection.findOne({ josephcoinId: req.body.fromJosephcoinId })
        const to = req.body.toDiscordId
            ? await usersCollection.findOne({ discordId: req.body.toDiscordId })
            : await usersCollection.findOne({ josephcoinId: req.body.toJosephcoinId })

        if (!from || !to) {
            res.send({ error: 'User not found' })
            return
        }
        const newFromBalance = Number(from.balance) - Number(req.body.amount)
        const newToBalance = Number(to.balance) + Number(req.body.amount)
        if (newFromBalance < 0) {
            res.send({ error: 'User does not have enough coins' })
            return
        }

        const _updateFromBalanceResult = await usersCollection.updateOne(
            { _id: from._id },
            { $set: { balance: newFromBalance } }
        )
        if (!_updateFromBalanceResult) {
            res.send({ error: 'Error updating user balance' })
            return
        }
        const _updateToBalanceResult = await usersCollection.updateOne(
            { _id: to._id },
            { $set: { balance: newToBalance } }
        )
        if (!_updateToBalanceResult) {
            res.send({ error: 'Error updating user balance' })
            return
        }
        const _updateFromTransactionsResult = await usersCollection.updateOne(
            { _id: from._id },
            {
                $push: {
                    transactions: {
                        transaction: {
                            type: 'sent',
                            amount: req.body.amount,
                            to: to._id,
                            date: new Date()
                        }
                    }
                }
            }
        )
        if (!_updateFromTransactionsResult) {
            res.send({ error: 'Error updating user transactions' })
            return
        }
        const _updateToTransactionsResult = await usersCollection.updateOne(
            { _id: to._id },
            {
                $push: {
                    transactions: {
                        transaction: {
                            type: 'recieved',
                            amount: req.body.amount,
                            from: from._id,
                            date: new Date()
                        }
                    }
                }
            }
        )
        if (!_updateToTransactionsResult) {
            res.send({ error: 'Error updating user transactions' })
            return
        }
        res.send({
            fromBalance: newFromBalance,
            toBalance: newToBalance
        })
    })
})

function loggerMiddleware (req: any, res: any, next: any): void {
    const oldWrite = res.write
    const oldEnd = res.end
    const chunks = []

    res.write = function (chunk: never, ...args: any) {
        chunks.push(chunk)
        return oldWrite.apply(res, args)
    }

    res.end = function (chunk: never) {
        if (chunk) chunks.push(chunk)
        if (typeof chunk !== 'string') {
            const responseBody = Buffer.concat(chunks).toString('utf8')
            const query = JSON.stringify(req.query)
            const body = JSON.stringify(req.body)

            console.log(
                `(${new Date().toLocaleTimeString()}) ${req.method} ${req.path}\n` +
                    `\t${'Query: ' + (query !== '{}' ? query : '(empty query)'.italic)}\n` +
                    `\t${'Body: ' + (body !== '{}' ? body : '(empty body)'.italic.gray)}\n` +
                    `\tResponse body: ${responseBody}\n`
            )
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
        oldEnd.apply(res, arguments)
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
