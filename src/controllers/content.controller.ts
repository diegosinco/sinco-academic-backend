import { Request, Response, NextFunction } from 'express';
import { contentService } from '../services/content.service';

export class ContentController {
  /** Public: list active elements */
  async getActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = req.query.type as string | undefined;
      const elements = await contentService.getActive(type);
      res.status(200).json({ success: true, data: elements });
    } catch (error) {
      next(error);
    }
  }

  /** Public: get one by key */
  async getByKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key } = req.params;
      const element = await contentService.getByKey(key);
      res.status(200).json({ success: true, data: element });
    } catch (error) {
      next(error);
    }
  }

  /** Admin: list all elements */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = req.query.type as string | undefined;
      const elements = await contentService.getAll(type);
      res.status(200).json({ success: true, data: elements });
    } catch (error) {
      next(error);
    }
  }

  /** Admin: get by id */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const element = await contentService.getById(id);
      res.status(200).json({ success: true, data: element });
    } catch (error) {
      next(error);
    }
  }

  /** Admin: create */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const element = await contentService.create(req.body);
      res.status(201).json({ success: true, data: element, message: 'Content element created' });
    } catch (error) {
      next(error);
    }
  }

  /** Admin: update */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const element = await contentService.update(id, req.body);
      res.status(200).json({ success: true, data: element, message: 'Content element updated' });
    } catch (error) {
      next(error);
    }
  }

  /** Admin: delete */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await contentService.delete(id);
      res.status(200).json({ success: true, message: 'Content element deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export const contentController = new ContentController();
