import { Response, NextFunction } from 'express';
import { cohortRoleService } from '../services/cohortRole.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const cohortRoleController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { cohortId } = req.params;
      const { name } = req.body;
      
      const id = Array.isArray(cohortId) ? cohortId[0] : cohortId;
      const role = await cohortRoleService.create(id, name);
      
      res.status(201).json(role);
    } catch (error) {
      next(error);
    }
  },

  async findByCohort(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { cohortId } = req.params;
      
      const id = Array.isArray(cohortId) ? cohortId[0] : cohortId;
      const roles = await cohortRoleService.findByCohort(id);
      
      res.json(roles);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const roleId = Array.isArray(id) ? id[0] : id;
      await cohortRoleService.delete(roleId);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};