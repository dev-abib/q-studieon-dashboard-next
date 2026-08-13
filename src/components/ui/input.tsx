import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 px-3.5 py-2 text-sm transition-all outline-none focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 focus-visible:outline-none focus-visible:border-slate-400 dark:focus-visible:border-slate-500 focus-visible:ring-0 placeholder:text-slate-400 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-50 dark:disabled:bg-slate-800",
        className
      )}
      {...props}
    />
  )
}

export { Input }
