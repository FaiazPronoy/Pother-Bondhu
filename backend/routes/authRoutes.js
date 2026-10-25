import express from 'express'
import { authStatus, login, logout, register } from '../controllers/authController.js';

const authRouter = express.Router();

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.post('/logout', logout)

authRouter.get('/status', authStatus)



export default authRouter