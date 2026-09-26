import express from 'express'
import { authStatus, isAuthenticated, login, logout, register } from '../controllers/authController.js';
import userAuth from '../middleware/userAuth.js';

const authRouter = express.Router();

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.post('/logout', logout)
authRouter.post('/is-auth', userAuth, isAuthenticated)

authRouter.get('/status', authStatus)



export default authRouter