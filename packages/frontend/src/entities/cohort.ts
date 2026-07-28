export interface Cohort {
  id: string;
  /** Название / год потока практики (например, «2026») */
  name: string;
  applicationStart: string;
  applicationEnd: string;
  practiceStart: string;
  practiceEnd: string;
  /** Флаг архивации */
  isArchived: boolean;
  createdAt?: string;
  updatedAt?: string;
}
