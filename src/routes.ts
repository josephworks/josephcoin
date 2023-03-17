import { Router } from 'express'
import { getTodos, addTodo, updateTodo, deleteTodo } from './controllers/todos'

const routes = Router()

routes.get('/todos', getTodos)
routes.post('/todo', addTodo)
routes.patch('/todo/:id', updateTodo)
routes.delete('/todo/:id', deleteTodo)

export default routes
