// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8787/api/v1';

// ALL PROMOTION HOOKS UNUSED - Commented out
// export const useCalculatePromotion = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: async ({ studentId, termId }: { studentId: string; termId: string }) => {
//       const response = await fetch(`${API_BASE}/promotions/calculate/${studentId}/${termId}`, {
//         method: 'POST'
//       });
//       if (!response.ok) throw new Error('Failed to calculate promotion');
//       return response.json();
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['promotions'] });
//     }
//   });
// };

// export const useProcessBulkPromotions = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: async (termId: string) => {
//       const response = await fetch(`${API_BASE}/promotions/process-bulk/${termId}`, {
//         method: 'POST'
//       });
//       if (!response.ok) throw new Error('Failed to process bulk promotions');
//       return response.json();
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['promotions'] });
//     }
//   });
// };

// export const usePromotionStatistics = (termId: string) => {
//   return useQuery({
//     queryKey: ['promotions', 'statistics', termId],
//     queryFn: async () => {
//       const response = await fetch(`${API_BASE}/promotions/statistics/${termId}`);
//       if (!response.ok) throw new Error('Failed to fetch promotion statistics');
//       return response.json();
//     },
//     enabled: !!termId
//   });
// };

// export const usePromotionPreview = (studentId: string, termId: string) => {
//   return useQuery({
//     queryKey: ['promotions', 'preview', studentId, termId],
//     queryFn: async () => {
//       const response = await fetch(`${API_BASE}/promotions/preview/${studentId}/${termId}`);
//       if (!response.ok) throw new Error('Failed to fetch promotion preview');
//       return response.json();
//     },
//     enabled: !!studentId && !!termId
//   });
// };