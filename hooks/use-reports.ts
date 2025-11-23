import { useQuery } from '@tanstack/react-query';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://athena-beta.schoolpilot.workers.dev/api/v1';

// Report interfaces matching the athena-beta backend response
export interface SubjectGrade {
  weekly: number;
  summative: number;
  exam: number;
  total: number;
}

export interface StudentReport {
  id: string;
  name: string;
  grades: Record<string, SubjectGrade>;
  termTotal: number;
  broughtForward: number;
  cumulative: number;
  average: number;
  position: string; // "1st", "2nd", "3rd", etc.
  remarks: string; // "PASSED", "FAILED", "REPEAT"
}

export interface ClassStats {
  totalStudents: number;
  passedStudents: number;
  failedStudents: number;
  classAverage: number;
  highestScore: number;
  lowestScore: number;
}

export interface ClassReportResponse {
  success: boolean;
  data: {
    class: string; // e.g., "Basic_3"
    term: string; // e.g., "First Term 2024/2025"
    session: string; // e.g., "2024/2025"
    subjects: string[]; // Array of subject names
    students: StudentReport[];
    classStats: ClassStats;
  };
  message: string;
  timestamp: string;
}

// Hook to fetch class sheet reports
export const useClassReport = (termId?: string, gradeLevel?: string, schoolId?: string) => {
  return useQuery<ClassReportResponse>({
    queryKey: ['reports', 'class-sheet', termId, gradeLevel, schoolId],
    queryFn: async () => {
      if (!termId || !gradeLevel || !schoolId) {
        throw new Error('Term ID, Grade Level, and School ID are required');
      }
      
      const response = await fetch(
        `${BASE_URL}/reports/class-sheet/${termId}/${gradeLevel}/${schoolId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch class report: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: !!(termId && gradeLevel && schoolId),
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutes - reports don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes - keep reports cached longer
    retry: 1,
  });
};

// Hook to export class sheet (future implementation)
// UNUSED: Not currently used by any components in athena-client
// export const useExportClassSheet = () => {
//   // This will be implemented when export functionality is needed
//   return {
//     exportPDF: async (termId: string, gradeLevel: string, schoolId: string) => {
//       const response = await fetch(
//         `${BASE_URL}/reports/class-sheet/${termId}/${gradeLevel}/${schoolId}/export?format=pdf`
//       );
      
//       if (!response.ok) {
//         throw new Error('Failed to export class sheet');
//       }
      
//       // Handle PDF download
//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `class-sheet-${gradeLevel}-${termId}.pdf`;
//       document.body.appendChild(a);
//       a.click();
//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(a);
//     }
//   };
// };