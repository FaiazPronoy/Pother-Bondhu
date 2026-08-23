import express from 'express'
import { volunteers, getVolunteerProfile, getTopVolunteers, donateToVolunteer } from '../controllers/volunteerController.js'
import userAuth from '../middleware/userAuth.js'

const volunteerRouter = express.Router()

volunteerRouter.get('/', volunteers)
volunteerRouter.get('/top', getTopVolunteers);
volunteerRouter.get('/:id', getVolunteerProfile);
volunteerRouter.post('/:id/donate', userAuth, donateToVolunteer);




export default volunteerRouter;
