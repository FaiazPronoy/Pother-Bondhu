import express from 'express';
import { 
  sendInvitations, 
  getMyInvitations, 
  respondToInvitation 
} from '../controllers/inviteController.js';
import userAuth from '../middleware/userAuth.js'

const router = express.Router();

router.post('/invites/send', userAuth, sendInvitations);

router.get('/invites/me', userAuth, getMyInvitations);

router.patch('/invites/:id/respond',userAuth, respondToInvitation);

export default router;