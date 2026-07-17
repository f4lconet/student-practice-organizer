import { Response, NextFunction } from 'express';
import { documentService } from '../services/document.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { ValidationError } from '../errors/index.js';
import { DocumentType } from '../types/document.types.js';

export const adminDocumentController = {
  async approveDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const cohortId = Array.isArray(req.params.cohortId) ? req.params.cohortId[0] : req.params.cohortId;
      const type = Array.isArray(req.params.type) ? req.params.type[0] : req.params.type;

      const validTypes: DocumentType[] = ['individual-task', 'report', 'title-page', 'review'];
      if (!validTypes.includes(type as DocumentType)) {
        throw new ValidationError(`Неверный тип документа: ${type}`);
      }

      const { fileUrl, comment } = req.body;

      const doc = await documentService.approveDocument(userId, cohortId, type as DocumentType, fileUrl, comment);
      res.json(doc);
    } catch (error) {
      next(error);
    }
  },

  async rejectDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const cohortId = Array.isArray(req.params.cohortId) ? req.params.cohortId[0] : req.params.cohortId;
      const type = Array.isArray(req.params.type) ? req.params.type[0] : req.params.type;

      const validTypes: DocumentType[] = ['individual-task', 'report', 'title-page', 'review'];
      if (!validTypes.includes(type as DocumentType)) {
        throw new ValidationError(`Неверный тип документа: ${type}`);
      }

      const { comment } = req.body;
      if (!comment) {
        throw new ValidationError('comment обязателен при отклонении');
      }

      const doc = await documentService.rejectDocument(userId, cohortId, type as DocumentType, comment);
      res.json(doc);
    } catch (error) {
      next(error);
    }
  },

  async getStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const cohortId = Array.isArray(req.params.cohortId) ? req.params.cohortId[0] : req.params.cohortId;
      const type = Array.isArray(req.params.type) ? req.params.type[0] : req.params.type;

      const validTypes: DocumentType[] = ['individual-task', 'report', 'title-page', 'review'];
      if (!validTypes.includes(type as DocumentType)) {
        throw new ValidationError(`Неверный тип документа: ${type}`);
      }

      const status = await documentService.getStatus(userId, cohortId, type as DocumentType);
      res.json(status);
    } catch (error) {
      next(error);
    }
  },
};