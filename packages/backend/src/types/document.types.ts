export type DocumentType = 'individual-task' | 'report' | 'title-page' | 'review';

export type DocumentStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'revised';

export const DOCUMENT_TYPES: DocumentType[] = ['individual-task', 'report', 'title-page', 'review'];
export const DOCUMENT_STATUSES: DocumentStatus[] = ['draft', 'pending', 'approved', 'rejected', 'revised'];

export const DOCUMENT_TYPE_MAP: Record<DocumentType, string> = {
  'individual-task': 'Индивидуальное задание',
  'report': 'Отчёт',
  'title-page': 'Титульный лист',
  'review': 'Отзыв',
};

export type DocumentStatusFields = {
  status: DocumentStatus;
  comment?: string;
  fileUrl?: string;
  adminFileUrl?: string;
};

export interface SubmitDocumentDto {
  type: DocumentType;
}

export interface AdminApproveDocumentDto {
  fileUrl: string;
  comment?: string;
}

export interface AdminRejectDocumentDto {
  comment: string;
}

export interface DocumentStatusResponse {
  type: DocumentType;
  status: DocumentStatus;
  comment: string | null;
  fileUrl: string | null;
  adminFileUrl: string | null;
  canGenerate: boolean;
  canSubmit: boolean;
  canResubmit: boolean;
}