import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from './use-store';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8787/api/v1';

export const useActiveTerm = () => {
  return useQuery({
    queryKey: ['terms', 'active'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/terms/active`);
      if (!response.ok) throw new Error('Failed to fetch active term');
      return response.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for getting active term by school (uses athena-beta)
export const useActiveTermBySchool = () => {
  const { schoolId } = useSessionStore();
  
  return useQuery({
    queryKey: ['terms', 'active', 'school', schoolId],
    queryFn: async () => {
      if (!schoolId) {
        throw new Error('No school ID available');
      }
      
      const response = await fetch(`${API_BASE}/terms/active/school/${schoolId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch active term for school');
      }
      return response.json();
    },
    enabled: !!schoolId,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};


// UNUSED - Commented out
// export const useTerms = () => {
//   return useQuery({
//     queryKey: ['terms'],
//     queryFn: async () => {
//       const response = await fetch(`${API_BASE}/terms`);
//       if (!response.ok) throw new Error('Failed to fetch terms');
//       return response.json();
//     }
//   });
// };

// UNUSED - Commented out
// export const useCreateTerm = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: async (data) => {
//       const response = await fetch(`${API_BASE}/terms`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data)
//       });
//       if (!response.ok) throw new Error('Failed to create term');
//       return response.json();
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['terms'] });
//     }
//   });
// };

// UNUSED - Commented out
// export const useTerm = (id: string) => {
//   return useQuery({
//     queryKey: ['terms', id],
//     queryFn: async () => {
//       const response = await fetch(`${API_BASE}/terms/${id}`);
//       if (!response.ok) throw new Error('Failed to fetch term');
//       return response.json();
//     },
//     enabled: !!id
//   });
// };

// UNUSED - Commented out
// export const useUpdateTermWeek = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: async ({ id, currentWeek }: { id: string; currentWeek: number }) => {
//       const response = await fetch(`${API_BASE}/terms/${id}/week`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ currentWeek })
//       });
//       if (!response.ok) throw new Error('Failed to update term week');
//       return response.json();
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['terms'] });
//     }
//   });
// };

// UNUSED - Commented out
// export const useTermProgress = (id: string) => {
//   return useQuery({
//     queryKey: ['terms', id, 'progress'],
//     queryFn: async () => {
//       const response = await fetch(`${API_BASE}/terms/${id}/progress`);
//       if (!response.ok) throw new Error('Failed to fetch term progress');
//       return response.json();
//     },
//     enabled: !!id
//   });
// };