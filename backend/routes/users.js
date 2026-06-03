import express from 'express';
import {
  getProfile, updateProfile, uploadPhoto, deletePhoto, discoverProfiles, getUserById, uploadPublicKey, getPublicKey
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { uploadPhotos } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', uploadPhotos, updateProfile);
router.post('/photos', uploadPhoto);
router.delete('/photos/:photoId', deletePhoto);
router.get('/discover', discoverProfiles);
router.put('/public-key', uploadPublicKey);
router.get('/public-key/:userId', getPublicKey);
router.get('/:id', getUserById);

export default router;
