import { create } from "zustand";

/**
 * Zustand-стор для хранения выбранной админом когорты.
 * Выбор когорты определяет cohortId в URL для всех админских маршрутов.
 */
interface AdminCohortState {
  selectedCohortId: string | null;
  setSelectedCohortId: (cohortId: string | null) => void;
}

export const useAdminCohortStore = create<AdminCohortState>((set) => ({
  selectedCohortId: null,
  setSelectedCohortId: (cohortId) => set({ selectedCohortId: cohortId }),
}));