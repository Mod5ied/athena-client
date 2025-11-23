// import { useQuery } from '@tanstack/react-query';

// const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8787/api/v1';

// UNUSED - Commented out
// export const useSubjects = (gradeLevel?: string, schoolId?: string) => {
//   return useQuery({
//     queryKey: ['subjects', gradeLevel || 'all', schoolId || 'all'],
//     queryFn: async () => {
//       const params = new URLSearchParams();
//       if (gradeLevel) params.append('gradeLevel', gradeLevel);
//       if (schoolId) params.append('schoolId', schoolId);
//       
//       const url = `${API_BASE}/subjects${params.toString() ? `?${params.toString()}` : ''}`;
//       const response = await fetch(url);
//       if (!response.ok) throw new Error('Failed to fetch subjects');
//       return response.json();
//     }
//   });
// };

// UNUSED - Commented out
// export const useSubjectsByGrade = (gradeLevel: string, schoolId?: string) => {
//   return useQuery({
//     queryKey: ['subjects', 'grade', gradeLevel, schoolId || 'all'],
//     queryFn: async () => {
//       const params = new URLSearchParams();
//       if (schoolId) params.append('schoolId', schoolId);
//       
//       const url = `${API_BASE}/subjects/grade/${gradeLevel}${params.toString() ? `?${params.toString()}` : ''}`;
//       const response = await fetch(url);
//       if (!response.ok) throw new Error('Failed to fetch subjects by grade');
//       return response.json();
//     },
//     enabled: !!gradeLevel
//   });
// };