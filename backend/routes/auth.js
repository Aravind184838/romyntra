import express from 'express';
import { register, login, sendOTP, verifyOTP, getMe, verifyFirebase, loginFirebase, changeEmail, changePhone, changePassword, deleteAccount } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/verify-firebase', protect, verifyFirebase);
router.post('/login-firebase', loginFirebase);
router.get('/me', protect, getMe);
router.put('/change-email', protect, changeEmail);
router.put('/change-phone', protect, changePhone);
router.put('/change-password', protect, changePassword);
router.delete('/account', protect, deleteAccount);

export default router;
