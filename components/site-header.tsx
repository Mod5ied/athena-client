"use client"

import { useSessionStore } from "@/hooks/use-store"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"

export function SiteHeader() {
  const { name, clearSession } = useSessionStore()
  const router = useRouter()
  
  const handleLogout = () => {
    clearSession()
    router.push('/')
  }
  
  return (
    <header className="flex h-14 items-center border-b px-6 lg:px-8">
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden hover:cursor-pointer" />
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="font-medium hidden md:block">{name}</span>
          <Button
            className="p-2 hover:bg-gray-100 rounded-md transition-colors hover:cursor-pointer"
            variant="ghost"
            onClick={handleLogout}
          >
            <LogOut className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  )
}