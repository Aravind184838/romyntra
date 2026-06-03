import express from 'express';
import { likeUser, passUser, superLikeUser } from '../controllers/swipeController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/like', likeUser);
router.post('/pass', passUser);
router.post('/superlike', superLikeUser);

export default router;
