import { Request, Response, NextFunction } from 'express';
import { blogService } from '../services/blog.service';
import { AuthRequest } from '../middlewares/auth';
import { ValidationError, UnauthorizedError } from '../utils/errors';

export class BlogController {
  /**
   * @swagger
   * /api/blog:
   *   get:
   *     summary: Listar posts del blog
   *     tags: [Blog]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Número de página
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Cantidad de posts por página
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: Slug de la categoría
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Búsqueda por título o contenido
   *     responses:
   *       200:
   *         description: Lista de posts
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     posts:
   *                       type: array
   *                       items:
   *                         type: object
   *                     total:
   *                       type: integer
   *                     page:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   */
  async getPosts(req: Request | AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        category: req.query.category as string,
        search: req.query.search as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
      };

      // Si el usuario está autenticado como instructor o admin, puede ver todos los posts
      const authReq = req as AuthRequest;
      const includeUnpublished = 
        authReq.user?.role === 'instructor' || 
        authReq.user?.role === 'admin';

      const result = await blogService.getPosts(filters, includeUnpublished);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPostBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const post = await blogService.getPostBySlug(slug);
      res.status(200).json({
        success: true,
        data: post,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener post por ID o slug
   * Soporta tanto acceso público (por slug) como administrativo (por ID)
   */
  async getPostByIdOrSlug(req: Request | AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier } = req.params; // Puede ser ID o slug
      
      // Si el usuario está autenticado como instructor o admin, puede ver posts no publicados
      const authReq = req as AuthRequest;
      const includeUnpublished = 
        authReq.user?.role === 'instructor' || 
        authReq.user?.role === 'admin';

      const post = await blogService.getPostByIdOrSlug(identifier, includeUnpublished);
      res.status(200).json({
        success: true,
        data: post,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await blogService.getCategories();
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crear un nuevo post de blog
   * POST /api/blog
   */
  async createPost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError('Usuario no autenticado');
      }

      const post = await blogService.createPost(req.body, req.user.id);

      res.status(201).json({
        success: true,
        data: post,
        message: 'Post creado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar un post de blog
   * PUT /api/blog/:id
   */
  async updatePost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id || !req.user?.role) {
        throw new UnauthorizedError('Usuario no autenticado');
      }

      const { id } = req.params;
      const post = await blogService.updatePost(id, req.body, req.user.id, req.user.role);

      res.status(200).json({
        success: true,
        data: post,
        message: 'Post actualizado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Eliminar un post de blog
   * DELETE /api/blog/:id
   */
  async deletePost(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id || !req.user?.role) {
        throw new UnauthorizedError('Usuario no autenticado');
      }

      const { id } = req.params;
      const result = await blogService.deletePost(id, req.user.id, req.user.role);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/blog/{id}/status:
   *   patch:
   *     summary: Publicar o despublicar un post de blog
   *     tags: [Blog]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del post
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - isPublished
   *             properties:
   *               isPublished:
   *                 type: boolean
   *                 description: Estado del post (true = publicado, false = despublicado)
   *     responses:
   *       200:
   *         description: Estado del post actualizado exitosamente
   *       400:
   *         description: Error de validación
   *       401:
   *         description: No autenticado
   *       403:
   *         description: No autorizado (solo admin)
   *       404:
   *         description: Post no encontrado
   */
  /**
   * Actualizar el estado publicado/no publicado de un post de blog
   * PATCH /api/blog/:id/status
   */
  async updatePostStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id || !req.user?.role) {
        throw new UnauthorizedError('Usuario no autenticado');
      }

      // Solo admin puede cambiar el estado
      if (req.user.role !== 'admin') {
        throw new UnauthorizedError('Solo los administradores pueden cambiar el estado de los posts');
      }

      const { id } = req.params;
      const { isPublished } = req.body;

      if (typeof isPublished !== 'boolean') {
        throw new ValidationError('El campo isPublished debe ser un booleano');
      }

      const post = await blogService.updatePostStatus(id, isPublished);

      res.status(200).json({
        success: true,
        data: post,
        message: `Post ${isPublished ? 'publicado' : 'despublicado'} exitosamente`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const blogController = new BlogController();


