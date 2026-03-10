import { Router } from 'express';
import { contentController } from '../controllers/content.controller';
import { publicLimiter } from '../middlewares/rateLimit';

const router = Router();

// Public routes (no auth)
router.get('/', publicLimiter, contentController.getActive.bind(contentController));
router.get('/key/:key', publicLimiter, contentController.getByKey.bind(contentController));

export default router;
