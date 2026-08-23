import express from 'express';
import userAuth from '../middleware/userAuth.js';
import { uploadImage } from '../controllers/uploadController.js';
import upload from '../utils/upload.js'; 

const uploadRouter = express.Router();

// Properly ordered middleware chain:
uploadRouter.post(
  '/rescue',
  userAuth,            
  upload.single('image'), 
  uploadImage          
);

// multer rejects bad files by throwing, which would otherwise return Express's
// HTML error page to a caller expecting JSON
uploadRouter.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
});

export default uploadRouter;