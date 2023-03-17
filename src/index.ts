import bodyParser from 'body-parser'
import express from 'express'
import routes from './routes'
import swaggerUi from 'swagger-ui-express'
const swaggerDocument = require('./swagger.json')

// new express app instance
const app = express()

// call midleware
app.use(bodyParser.json())

// call routes
app.use('/api', routes)

// add swashbuckle for swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// export express app
export default app
