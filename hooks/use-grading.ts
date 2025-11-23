import { useQuery, useMutation } from '@tanstack/react-query';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Student interface from athena-beta backend
export interface Student {
  id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  name: string;
  gradeLevel: string;
  dateOfBirth: string;
  gender: string;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  enrollmentDate: string;
  isActive: boolean;
  createdAt: string;
}

// Student grades display interfaces
export interface StudentAssessment {
  week: number;
  maxPoints: number;
  score: number;
}

export interface SubjectGrades {
  subjectId: string;
  subjectName: string;
  assessments: StudentAssessment[];
}

export interface StudentGradesResponse {
  success: boolean;
  data: {
    studentName: string;
    termName: string;
    subjects: SubjectGrades[];
  };
}

export interface StudentsListResponse {
  success: boolean;
  data: {
    schoolId: string;
    totalStudents: number;
    students: Student[];
  };
  message: string;
  timestamp: string;
}

// Record assessment request interface
export interface RecordAssessmentRequest {
  studentId: string;
  subjectId: string;
  termId: string;
  assessmentType: 'weekly' | 'summative' | 'exam';
  score: number;
  week: number; // Required for all assessment types including exams
}

export const useRecordAssessment = () => {
  // const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: RecordAssessmentRequest) => {
      const response = await fetch(`${BASE_URL}/grading/assessments/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to record assessment');
      }
      return response.json();
    },
    onSuccess: () => {
    // onSuccess: (_, variables) => {
      // Refetch commented out to preserve optimistic updates
      // setTimeout(() => {
      //   const queryKey = ['student-grades', variables.studentId, variables.termId];
      //   queryClient.invalidateQueries({ queryKey });
      // }, 1000);
    }
  });
};

// UNUSED - Commented out
// export const useStudentAssessments = (studentId: string, termId: string) => {
//   return useQuery({
//     queryKey: ['grading', 'students', studentId, 'assessments', termId],
//     queryFn: async () => {
//       const response = await fetch(`${BASE_URL}/grading/students/${studentId}/assessments/${termId}`);
//       if (!response.ok) throw new Error('Failed to fetch student assessments');
//       return response.json();
//     },
//     enabled: !!studentId && !!termId,
//     refetchOnWindowFocus: false,
//     staleTime: 5 * 60 * 1000,
//     retry: 1,
//   });
// };

// Hook for fetching student grades for display (matches GradesView component)
export const useStudentGrades = (studentId?: string, termId?: string) => {
  return useQuery<StudentGradesResponse>({
    queryKey: ['student-grades', studentId, termId],
    queryFn: async () => {
      if (!studentId || !termId) {
        throw new Error('Student ID and Term ID are required');
      }
      
      const response = await fetch(
        `${BASE_URL}/grading/students/${studentId}/assessments/${termId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch student grades');
      }
      
      return response.json();
    },
    enabled: !!(studentId && termId),
    refetchOnWindowFocus: false, // Don't auto-refetch on focus to prevent loops
    staleTime: 30 * 1000, // 30 seconds - reasonable time before considering data stale
    gcTime: 5 * 60 * 1000, // 5 minutes - keep data in cache for reasonable time
    retry: 1,
    // Clean data transformer - always return fresh server data
    select: (data: any) => {
      // Always return clean server data without any caching metadata
      const { _optimisticUpdates, _lastUpdateTime, ...cleanData } = data;
      return cleanData;
    },
  });
};