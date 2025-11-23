'use client';

import { ReportsView } from "@/components/reports-view";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { useActiveTermBySchool } from "@/hooks/use-terms";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default function ReportsPage() {
  const { data: activeTermData } = useActiveTermBySchool();
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "280px",
        "--header-height": "48px",
      } as React.CSSProperties}
    >
      <AppSidebar 
        variant="inset" 
        activeItem="reports"
        activeTermData={activeTermData}
      />
      <SidebarInset className="overflow-hidden">
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-hidden max-w-full">
          <div className="flex flex-1 flex-col gap-2 p-4 lg:p-6 overflow-hidden max-w-full">
            <div className="overflow-auto max-w-full">
              <ReportsView />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}