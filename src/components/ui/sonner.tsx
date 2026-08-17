"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-emerald-500" />
        ),
        info: (
          <InfoIcon className="size-4 text-primary" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-amber-500" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-red-500" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-primary" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast: "cn-toast font-sans bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-2xl rounded-2xl p-4 text-black dark:text-white ring-2 ring-primary/15",
          title: "text-xs font-bold text-black dark:text-white uppercase tracking-wider",
          description: "!text-black dark:!text-slate-100 font-semibold text-xs leading-relaxed mt-0.5",
          actionButton: "bg-primary text-primary-foreground font-semibold text-xs",
          cancelButton: "bg-muted text-muted-foreground font-semibold text-xs",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
