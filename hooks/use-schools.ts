import { useQuery } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

export interface School {
  id: string;
  name: string;
  tenantId: string;
  status: 'ONBOARDED' | 'PENDING' | 'SUSPENDED';
}

export interface SchoolsResponse {
  success: boolean;
  data: {
    totalSchools: number;
    schools: School[];
  };
  message: string;
  timestamp: string;
}

export const useSchools = () => {
  return useQuery<SchoolsResponse>({
    queryKey: ['schools'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/schools`);
      if (!response.ok) throw new Error('Failed to fetch schools');
      return response.json();
    }
  });
};

// UNUSED - Commented out
// export const useCreateSchool = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: async (data) => {
//       const response = await fetch(`${API_BASE}/schools`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data)
//       });
//       if (!response.ok) throw new Error('Failed to create school');
//       return response.json();
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['schools'] });
//     }
//   });
// };

// UNUSED - Commented out
// export const useSchool = (id: string) => {
//   return useQuery({
//     queryKey: ['schools', id],
//     queryFn: async () => {
//       const response = await fetch(`${API_BASE}/schools/${id}`);
//       if (!response.ok) throw new Error('Failed to fetch school');
//       return response.json();
//     },
//     enabled: !!id
//   });
// };

// UNUSED - Commented out
// export const useSchoolStats = (id: string) => {
//   return useQuery({
//     queryKey: ['schools', id, 'stats'],
//     queryFn: async () => {
//       const response = await fetch(`${API_BASE}/schools/${id}/stats`);
//       if (!response.ok) throw new Error('Failed to fetch school stats');
//       return response.json();
//     },
//     enabled: !!id
//   });
// };

// UNUSED - Commented out
// export const useValidateTermDate = () => {
//   return useMutation({
//     mutationFn: async (data) => {
//       const response = await fetch(`${API_BASE}/schools/validate-term-date`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data)
//       });
//       if (!response.ok) throw new Error('Failed to validate term date');
//       return response.json();
//     }
//   });
// };