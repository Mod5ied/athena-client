'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveTermBySchool } from '@/hooks/use-terms';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { StudentRegistration } from "@/components/student-registration";
import { GradesView } from "@/components/grades-view";
import { ReportsView } from "@/components/reports-view";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

type ActiveView = 'students' | 'grades' | 'reports' | 'download-reports';

export default function StaffDashboard() {
  const [activeView, setActiveView] = useState<ActiveView>('students');
  const router = useRouter();
  const { data: activeTermData } = useActiveTermBySchool();

  const handleItemClick = (itemId: string) => {
    if (itemId === 'reports') {
      // Navigate to dedicated reports page
      router.push('/staff/reports');
    } else {
      setActiveView(itemId as ActiveView);
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'students':
        return <StudentRegistration />;
      case 'grades':
        return <GradesView />;
      case 'reports':
        return <ReportsView />;
      case 'download-reports':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Download Reports</h2>
              <p className="text-gray-600">Export student data and performance reports</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-8 border text-center">
              <p className="text-gray-500">Download feature coming soon...</p>
            </div>
          </div>
        );
      default:
        return <StudentRegistration />;
    }
  };

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "280px",
        "--header-height": "48px",
      } as React.CSSProperties}
    >
      <AppSidebar 
        variant="inset" 
        activeItem={activeView}
        onItemClick={handleItemClick}
        activeTermData={activeTermData}
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-2 p-4 lg:p-6">
            {renderContent()}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}