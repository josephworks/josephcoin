import express from 'express';
import { MongoClient } from 'mongodb';

const app = express();
app.use(express.json());

// new mongodb connection (mongodb)
const url = 'mongodb://192.168.1.11:27017';
const dbName = 'JosephCoin';
export const client = new MongoClient(url);

const max_josephcoin_amount = 20000000;

client.connect(async () => {
    const db = client.db(dbName);
    const bankCollection = db.collection('Bank');
    await bankCollection.insertOne({
        checking: 258.57 / 2, // TODO: if less than 100, set to 0
        savings: 2500.03 / 2,
        date: new Date(),
    });
    const josephcoinCollection = db.collection('JosephCoin');

    const usersCollection = db.collection('Users');
});

app.get('/worth', (req, res) => {
    // get the current worth of the bank account
    client.connect(async () => {
        const db = client.db(dbName);
        const collection = db.collection('Bank');
        const result = await collection.findOne();
        res.send(
            new Object({
                worth: (result?.checking + result?.savings) / Number(req.query.amount),
            })
        );
    });
});

const port = 3000;
app.listen(port, () => {
    console.log(`[!] Server started on port: ${port}!`);
});
