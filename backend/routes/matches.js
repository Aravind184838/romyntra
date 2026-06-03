import express from 'express';
import { getMatches, getMatchById, getMatchRecommendations, unmatch, regenerateRecommendations } from '../controllers/matchController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getMatches);
router.get('/:id', getMatchById);
router.get('/:id/recommendations', getMatchRecommendations);
router.put('/:id/regenerate-recs', regenerateRecommendations);
router.delete('/:id', unmatch);

export default router;
