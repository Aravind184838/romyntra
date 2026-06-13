import express from 'express';
import {
  getProfile, updateProfile, uploadPhoto, deletePhoto, discoverProfiles, getUserById, uploadPublicKey, getPublicKey,
  getNotificationPreferences, updateNotificationPreferences,
  getPrivacySettings, updatePrivacySettings,
  createSupportTicket
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
router.get('/notification-preferences', getNotificationPreferences);
router.put('/notification-preferences', updateNotificationPreferences);
router.get('/privacy-settings', getPrivacySettings);
router.put('/privacy-settings', updatePrivacySettings);
router.post('/support-ticket', createSupportTicket);
router.get('/:id', getUserById);

export default router;
