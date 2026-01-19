import { Router } from 'express';
import { blogController } from '../controllers/blog.controller';

const router = Router();

router.get('/', blogController.getPosts.bind(blogController));
router.get('/categories', blogController.getCategories.bind(blogController));
router.get('/:slug', blogController.getPostBySlug.bind(blogController));

export default router;



