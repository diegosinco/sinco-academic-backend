import { Router } from 'express';
import { courseController } from '../controllers/course.controller';

const router = Router();

router.get('/', courseController.getCourses.bind(courseController));
router.get('/categories', courseController.getCategories.bind(courseController));
router.get('/:slug', courseController.getCourseBySlug.bind(courseController));

export default router;



