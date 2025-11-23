'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/hooks/use-store';

export default function Dashboard() {
  const router = useRouter();
  const { job } = useSessionStore();

  useEffect(() => {
    if (job === 'Teacher') {
      router.replace('/staff/dashboard');
    }
  }, [job, router]);

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Redirecting to dashboard...</h1>
        {/* <p className="text-gray-600">Taking you to your dashboard...</p> */}
      </div>
    </div>
  );
}