import express from 'express'
import router from './routes'
import swaggerJSDoc from 'swagger-jsdoc'
import { serve, setup } from 'swagger-ui-express'

// new express app instance
const app = express()

// call midleware
app.use(express.json())

// call routes
app.use('/api', router)

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'JosephCoin API',
            version: '1.0.0',
            description: 'The (internal) API for JosephCoin'
        },
        servers: [
            {
                url: 'http://localhost:3000/api'
            },
            {
                url: 'https://josephworks.net/josephcoin/api'
            }
        ]
    },
    apis: ['./routes/*.ts']
}

const swaggerSpec = swaggerJSDoc(options)

// add swashbuckle for swagger
app.use('/api-docs', serve)
app.get('/api-docs', setup(swaggerSpec))

// export express app
export default app
