import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type JobRole = 'HeadMistress' | 'Teacher';

interface EditingCell {
  week: number;
  subjectId: string;
  currentValue: number;
}

interface SessionState {
  name: string;
  job: JobRole | null;
  school: string;
  schoolId: string;
  gradeLevel: string;
  termId: string;
  termName: string;
  editingCell: EditingCell | null;
  isTableEditable: boolean;
  setName: (name: string) => void;
  setJob: (job: JobRole) => void;
  setSchool: (school: string, schoolId?: string) => void;
  setGradeLevel: (gradeLevel: string) => void;
  setTerm: (termId: string, termName: string) => void;
  setEditingCell: (cell: EditingCell | null) => void;
  setTableEditable: (editable: boolean) => void;
  clearSession: () => void;
  isAuthenticated: () => boolean;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      name: '',
      job: null,
      school: '',
      schoolId: '',
      gradeLevel: '',
      termId: '',
      termName: '',
      editingCell: null,
      isTableEditable: true,
      setName: (name) => set({ name }),
      setJob: (job) => set({ job }),
      setSchool: (school, schoolId = '') => set({ school, schoolId }),
      setGradeLevel: (gradeLevel) => set({ gradeLevel }),
      setTerm: (termId, termName) => set({ termId, termName }),
      setEditingCell: (cell) => set({ editingCell: cell }),
      setTableEditable: (editable) => set({ isTableEditable: editable }),
      clearSession: () => set({ 
        name: '', 
        job: null, 
        school: '', 
        schoolId: '', 
        gradeLevel: '',
        termId: '', 
        termName: '', 
        editingCell: null, 
        isTableEditable: true 
      }),
      isAuthenticated: () => {
        const state = get();
        return !!(state.name && state.job && state.school);
      },
    }),
    {
      name: 'session-storage',
      storage: createJSONStorage(() => sessionStorage)
    }
  )
);