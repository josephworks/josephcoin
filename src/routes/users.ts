import express, { Request, Response, NextFunction } from 'express'
import User from '../schema/UserSchema'

interface UserRequest extends Request {
  user?: any
}

const router = express.Router()

// Get all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find()
        res.json(users)
    } catch (err: any) {
        res.status(500).json({ message: err.message })
    }
})

// Get a single user
router.get('/users/:id', getUser, (req: UserRequest, res) => {
    res.json(req.user)
})

// Create a user
router.post('/users', async (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    })

    try {
        const newUser = await user.save()
        res.status(201).json(newUser)
    } catch (err : any) {
        res.status(400).json({ message: err.message })
    }
})

// Update a user
router.patch('/users/:id', getUser, async (req: UserRequest, res) => {
    if (req.body.name != null) {
        req.user.name = req.body.name
    }

    if (req.body.email != null) {
        req.user.email = req.body.email
    }

    if (req.body.password != null) {
        req.user.password = req.body.password
    }

    try {
        const updatedUser = await req.user.save()
        res.json(updatedUser)
    } catch (err : any) {
        res.status(400).json({ message: err.message })
    }
})

// Delete a user
router.delete('/users/:id', getUser, async (req: UserRequest, res) => {
    try {
        await req.user.remove()
        res.json({ message: 'Deleted User' })
    } catch (err : any) {
        res.status(500).json({ message: err.message })
    }
})

async function getUser (req: UserRequest, res: Response, next: NextFunction) {
    let user

    try {
        user = await User.findById(req.params.id)

        if (user == null) {
            return res.status(404).json({ message: 'Cannot find user' })
        }
    } catch (err : any) {
        return res.status(500).json({ message: err.message })
    }

    req.user = user
    next()
}
