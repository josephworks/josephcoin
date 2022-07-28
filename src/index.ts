/* eslint-disable @typescript-eslint/no-unused-vars */ // for testing
import path from 'node:path';
import express from 'express';
import { MongoClient } from 'mongodb';
import swaggerUi from 'swagger-ui-express';

const app = express();
app.use(express.json());

const swaggerAutogen = require('swagger-autogen')();

const endpointFiles = [path.join(__dirname, 'index')];

const config = {
    info: {
        title: 'JosephCoin',
        description: 'JosephCoin API Documentation',
    },
    host: 'localhost:3000',
    schemes: ['http'],
};

swaggerAutogen('../swagger.json', endpointFiles, config);

const swaggerDocument = require('../swagger.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// new mongodb connection (mongodb)
export const client = new MongoClient(process.env.URL.toString());
export const db = client.db(process.env.DBNAME.toString());

const max_josephcoin_amount = 20000000; //Unused for now

const router = express.Router();

client.connect(async () => {
    const bankCollection = db.collection('Bank');
    // await bankCollection.insertOne({
    //     checking: 258.57 / 2, // TODO: if less than 100, set to 0
    //     savings: 2500.03 / 2,
    //     date: new Date(),
    // });
    const josephcoinCollection = db.collection('JosephCoin');

    const usersCollection = db.collection('Users');
});

router.get('/worth', (req, res) => {
    // get the current worth of the bank account
    client.connect(async () => {
        const collection = db.collection('Bank');
        const result = await collection.findOne();
        const response = {
            worth: Number(result?.checking) + Number(result?.savings) / Number(req.query.amount),
        };
        res.send(response);
    });
});

router.post('/create-user', (req, res) => {
    // use discord id to create a new user with the default everything and a new josephcoin id maybe (probably incremental)
    client.connect(async () => {
        const usersCollection = db.collection('Users');
        const nextId = await usersCollection.estimatedDocumentCount();
        const insertResult = await usersCollection.insertOne({
            discordId: req.body.discordId,
            josephcoinId: nextId,
            balance: 0,
            transactions: [],
        });
        const result = await usersCollection.findOne({ _id: insertResult.insertedId });

        res.send(result);
    });
});

router.post('/add-coin', (req, res) => {
    // give a user coin using discord id or josephcoin id
    client.connect(async () => {
        const usersCollection = db.collection('Users');
        const user = req.body.discordId
            ? await usersCollection.findOne({ discordId: req.body.discordId })
            : await usersCollection.findOne({ josephcoinId: req.body.josephcoinId });

        if (!user) {
            res.send({ error: 'User not found' });
            return;
        }
        const newBalance = Number(user.balance) + Number(req.body.amount);
        const _updateBalanceResult = await usersCollection.updateOne(
            { _id: user._id },
            { $set: { balance: newBalance } }
        );
        const _updateTransactionsResult = await usersCollection.updateOne(
            { _id: user._id },
            {
                $push: {
                    transactions: {
                        transaction: {
                            type: 'addition',
                            amount: req.body.amount,
                            date: new Date(),
                        },
                    },
                },
            }
        );
        const _updateBank = await usersCollection.updateOne(
            { josephcoinId: 0 },
            { $inc: { balance: -req.body.amount } }
        );
        res.send({
            balance: newBalance,
        });
    });
});

router.post('/subtract-coin', (req, res) => {
    // take a user's coin using discord id or josephcoin id
    client.connect(async () => {
        const usersCollection = db.collection('Users');
        const user = req.body.discordId
            ? await usersCollection.findOne({ discordId: req.body.discordId })
            : await usersCollection.findOne({ josephcoinId: req.body.josephcoinId });

        if (!user) {
            res.send({ error: 'User not found' });
            return;
        }
        const newBalance = user.balance - req.body.amount;
        const _updateBalanceResult = await usersCollection.updateOne(
            { _id: user._id },
            { $set: { balance: newBalance } }
        );
        const _updateTransactionsResult = await usersCollection.updateOne(
            { _id: user._id },
            {
                $push: {
                    transactions: {
                        transaction: {
                            type: 'subtraction',
                            amount: req.body.amount,
                            date: new Date(),
                        },
                    },
                },
            }
        );
        const _updateBank = await usersCollection.updateOne(
            { josephcoinId: 0 },
            { $inc: { balance: req.body.amount } }
        );
        res.send({
            balance: newBalance,
        });
    });
});

router.post('/trade-coin', (req, res) => {
    // trade coin between two users using discord id or josephcoin id
});

let loggerMiddleware = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
): void => {
    next();
    console.log(`(${new Date().toLocaleTimeString()})  ${req.method} ${req.path} - ${res.json()}`);
};

app.use(loggerMiddleware);

app.use('/api', router);

const port = 3000;
app.listen(port, () => {
    console.log(`[!] Server started on port: ${port}!`);
});
