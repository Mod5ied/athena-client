"use client"

import { useRouter } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { UserPlus, GraduationCap, FileText, BarChart3, Download } from "lucide-react"
import { Button } from "./ui/button"

const menuItems = [
  {
    title: "Students",
    icon: UserPlus,
    id: "students"
  },
  {
    title: "Grades",
    icon: FileText,
    id: "grades"
  },
  {
    title: "Reports",
    icon: BarChart3,
    id: "reports"
  }
]

interface AppSidebarProps {
  variant?: "sidebar" | "floating" | "inset"
  activeItem?: string
  onItemClick?: (itemId: string) => void
  activeTermData?: any
}

export function AppSidebar({ variant = "sidebar", activeItem = "students", onItemClick, activeTermData }: AppSidebarProps) {
  const router = useRouter()
  
  // Check if it's the final week of the term
  const isFinalWeek = activeTermData?.data?.currentWeek === activeTermData?.data?.totalWeeks
  
  const handleItemClick = (itemId: string) => {
    if (itemId === 'reports') {
      router.push('/staff/reports')
    } else if (itemId === 'grades') {
      router.push('/staff/grades')
    } else if (itemId === 'students') {
      router.push('/staff/register-students')
    } else if (onItemClick) {
      onItemClick(itemId)
    }
  }

  return (
    <Sidebar variant={variant}>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-blue-600" />
          <span className="font-semibold text-gray-900">Athena</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-4 pt-6">
        <SidebarMenu className="space-y-2">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => handleItemClick(item.id)}
                isActive={activeItem === item.id}
                className="w-full justify-start px-4 py-3 h-auto"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="mb-3">
          <Button
            onClick={() => onItemClick?.("download-reports")}
            disabled={!isFinalWeek}
            className={`w-full flex items-center gap-2 px-4 py-3 transition-colors rounded-md ${
              isFinalWeek 
                ? 'bg-blue-600 hover:bg-blue-700 text-white hover:cursor-pointer' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={!isFinalWeek ? `Reports available only in final week (Week ${activeTermData?.data?.totalWeeks || 'N/A'})` : 'Download class reports'}
          >
            <Download className="h-4 w-4" />
            Download Reports
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}