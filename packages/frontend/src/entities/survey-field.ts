export type SurveyFieldType = "text" | "select";

export interface SurveyField {
  id: string;
  cohortId: string;
  label: string;
  type: SurveyFieldType;
  /** Варианты для поля типа select — в API приходит JSON-строка */
  options: string | null;
  order: number;
  isRequired?: boolean;
}