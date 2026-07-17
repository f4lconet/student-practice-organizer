export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface Application {
  id: string;
  userId: string;
  cohortId: string;
  cohortName?: string;
  status: ApplicationStatus;
  roleId: string | null;
  reviewComment: string | null;
  createdAt: string;
}

/** Поле анкеты со значением ответа */
export interface ApplicationFieldValue {
  id: string;
  applicationId: string;
  fieldId: string;
  value: string;
  field: {
    id: string;
    cohortId: string;
    label: string;
    type: "text" | "select";
    options: string | null;
    order: number;
    isRequired: boolean;
  };
}
