import { Router } from 'express';
import { blogController } from '../controllers/blog.controller';
import { publicLimiter } from '../middlewares/rateLimit';

const router = Router();

router.get('/', publicLimiter, blogController.getPosts.bind(blogController));
router.get('/categories', publicLimiter, blogController.getCategories.bind(blogController));
router.get('/:slug', publicLimiter, blogController.getPostBySlug.bind(blogController));

export default router;



