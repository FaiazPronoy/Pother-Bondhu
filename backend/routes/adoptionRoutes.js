import express from 'express';
import jwt from 'jsonwebtoken';
import userAuth from '../middleware/userAuth.js';
import upload from '../utils/upload.js';
import { listAdoptions, servePhoto, createAdoption, askToAdopt, myAdoptions, answerRequest } from '../controllers/adoptionController.js';

const adoptionRouter = express.Router();

// the list is public, but a signed-in visitor also sees their own request on each card
const viewer = (req, res, next) => {
  try {
    req.viewerId = jwt.verify(req.cookies.token, process.env.JWT_SECRET).id;
  } catch {
    req.viewerId = null;
  }
  next();
};

adoptionRouter.get('/', viewer, listAdoptions);
adoptionRouter.get('/mine', userAuth, myAdoptions);
adoptionRouter.get('/:id/photo', servePhoto);
adoptionRouter.post('/', userAuth, upload.single('image'), createAdoption);
adoptionRouter.post('/:id/requests', userAuth, askToAdopt);
adoptionRouter.patch('/:id/requests/:requestId', userAuth, answerRequest);

adoptionRouter.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message });
  next();
});

export default adoptionRouter;
