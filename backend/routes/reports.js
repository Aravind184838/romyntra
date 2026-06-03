import express from 'express';
import Report from '../models/Report.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// POST /api/reports — submit a report
router.post('/', async (req, res, next) => {
  try {
    const { reportedId, reason, description } = req.body;
    if (!reportedId || !reason) {
      return res.status(400).json({ success: false, message: 'Reported user and reason are required' });
    }
    const report = await Report.create({
      reporter: req.user._id,
      reported: reportedId,
      reason,
      description: description || ''
    });
    res.status(201).json({ success: true, message: 'Report submitted. Our team will review it.', report });
  } catch (error) {
    next(error);
  }
});

export default router;
