import express from 'express';
import {
  getAnalytics, getAllUsers, restrictUser, deleteUser, getReports, resolveReport, exportData, exportCsv, seedMatches, regenerateAllRecs
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/analytics', getAnalytics);
router.get('/users', getAllUsers);
router.put('/users/:id/restrict', restrictUser);
router.delete('/users/:id', deleteUser);
router.get('/reports', getReports);
router.put('/reports/:id', resolveReport);
router.get('/export/:type', exportData);
router.get('/export-csv/:type', exportCsv);
router.post('/seed-matches', seedMatches);
router.post('/regenerate-all-recs', regenerateAllRecs);

export default router;
