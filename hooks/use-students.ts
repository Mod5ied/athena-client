import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from './use-store';
import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002';

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  classLevel: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
}

// For athena-beta students (different structure)
export interface AthenaBetaStudent {
  id: string;
  schoolId: string;
  firstName?: string;
  lastName?: string;
  name: string;
  gradeLevel: string;
  dateOfBirth?: string;
  gender: string;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  enrollmentDate?: string;
  isActive?: boolean;
  createdAt?: string;
}

// For student submission to the backend API
export interface StudentSubmission {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO string format
  gender: 'Male' | 'Female';
  gradeLevel: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
}

export interface StudentsForDropdownResponse {
  success: boolean;
  data: {
    schoolId: string;
    totalStudents: number;
    students: AthenaBetaStudent[];
  };
  message: string;
  timestamp: string;
}

export const classLevels = [
  { label: 'Primary 1', value: 'Basic_1' },
  { label: 'Primary 2', value: 'Basic_2' },
  { label: 'Primary 3', value: 'Basic_3' },
  { label: 'Primary 4', value: 'Basic_4' },
  { label: 'Primary 5', value: 'Basic_5' },
  { label: 'Primary 6', value: 'Basic_6' },
];

const initialStudent: Student = {
  id: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: 'MALE',
  classLevel: '',
  guardianName: '',
  guardianPhone: '',
  guardianEmail: ''
};

// UNUSED - Commented out
// export const useStudents = () => {
//   return useQuery({
//     queryKey: ['students'],
//     queryFn: async () => {
//       const response = await fetch(`${API_BASE}/students`);
//       if (!response.ok) throw new Error('Failed to fetch students');
//       return response.json();
//     }
//   });
// };

// UNUSED - Commented out
// export const useCreateStudent = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: async (data: Omit<Student, 'id'>) => {
//       const response = await fetch(`${API_BASE}/students`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data)
//       });
//       if (!response.ok) throw new Error('Failed to create student');
//       return response.json();
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['students'] });
//     }
//   });
// };

export const useCreateStudentsBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { students: StudentSubmission[], schoolId: string }) => {
      const response = await fetch(`${API_BASE}/students/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create students batch');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    }
  });
};

export const useStudent = (id: string) => {
  return useQuery({
    queryKey: ['students', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/students/${id}`);
      if (!response.ok) throw new Error('Failed to fetch student');
      return response.json();
    },
    enabled: !!id
  });
};

// UNUSED - Commented out
// export const useStudentsByGrade = (gradeLevel: string) => {
//   return useQuery({
//     queryKey: ['students', 'grade', gradeLevel],
//     queryFn: async () => {
//       const response = await fetch(`${API_BASE}/students/grade/${gradeLevel}`);
//       if (!response.ok) throw new Error('Failed to fetch students by grade');
//       return response.json();
//     },
//     enabled: !!gradeLevel
//   });
// };

// UNUSED - Commented out
// export const useStudentSummary = (studentId: string, termId: string) => {
//   return useQuery({
//     queryKey: ['student-summary', studentId, termId],
//     queryFn: async () => {
//       const response = await fetch(`${API_BASE}/students/${studentId}/summary/${termId}`);
//       if (!response.ok) throw new Error('Failed to fetch student summary');
//       return response.json();
//     },
//     enabled: !!studentId && !!termId
//   });
// };

// Hook to get students for dropdown (athena-beta school-specific)
export const useStudentsForDropdown = () => {
  const { schoolId } = useSessionStore();
  
  return useQuery<StudentsForDropdownResponse>({
    queryKey: ['students-dropdown', schoolId],
    queryFn: async () => {
      if (!schoolId) {
        throw new Error('No school selected');
      }
      
      const response = await fetch(`${API_BASE}/students/school/${schoolId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          url: response.url
        });
        throw new Error(`Failed to fetch students: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!schoolId,
    retry: 1, // Only retry once to avoid excessive requests
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Form management hook
export function useStudentForm() {
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudent, setNewStudent] = useState<Student>(initialStudent);

  const addStudent = (studentData?: Partial<Student>): boolean => {
    const sourceStudent = studentData || newStudent;
    
    if (!sourceStudent.firstName || !sourceStudent.lastName || !sourceStudent.dateOfBirth || !sourceStudent.classLevel) {
      return false;
    }

    const studentToAdd: Student = {
      ...initialStudent,
      ...sourceStudent,
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    setStudents(prev => [...prev, studentToAdd]);
    
    // Only reset newStudent if we're adding from the form (not from OCR)
    if (!studentData) {
      setNewStudent(initialStudent);
    }
    
    return true;
  };

  const removeStudent = (id: string) => {
    setStudents(prev => prev.filter(student => student.id !== id));
  };

  const clearStudents = () => {
    setStudents([]);
  };

  const updateNewStudent = (field: string, value: string) => {
    setNewStudent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getClassLevelLabel = (value: string) => {
    const classLevel = classLevels.find(cl => cl.value === value);
    return classLevel ? classLevel.label : value;
  };

  const getStudentsForSubmission = (): StudentSubmission[] => {
    return students.map(student => {
      const submissionStudent: StudentSubmission = {
        firstName: student.firstName,
        lastName: student.lastName,
        dateOfBirth: new Date(student.dateOfBirth).toISOString(), // Convert to ISO string format
        gender: student.gender === 'MALE' ? 'Male' : 'Female',
        gradeLevel: student.classLevel // Note: API uses 'gradeLevel' not 'classLevel'
      };
      
      // Only include guardian fields if they have values
      if (student.guardianName) {
        submissionStudent.guardianName = student.guardianName;
      }
      if (student.guardianPhone) {
        submissionStudent.guardianPhone = student.guardianPhone;
      }
      if (student.guardianEmail) {
        submissionStudent.guardianEmail = student.guardianEmail;
      }
      
      return submissionStudent;
    });
  };

  return {
    students,
    newStudent,
    addStudent,
    removeStudent,
    clearStudents,
    updateNewStudent,
    getClassLevelLabel,
    getStudentsForSubmission,
    classLevels
  };
}