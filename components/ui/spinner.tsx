import * as React from "react"

import { cn } from "@/lib/utils"

const Spinner = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 h-8 w-8", className)}
    {...props}
  />
))
Spinner.displayName = "Spinner"

export { Spinner }