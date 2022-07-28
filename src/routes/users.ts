import * as Process from 'node:process';
import express, { Router } from 'express';
import { client, db } from '../index';

let router = Router();

router.get('/', (req, res) => {
    // Get user info
    // use discord id or josephcoin id(?) to get a user's info such as balance, transaction history, etc.
    client.connect(async () => {
        const usersCollection = db.collection('Users');
    });
});

router.post('/', (req, res) => {
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

module.exports = router;
