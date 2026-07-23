// components/sidebar.tsx
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Settings,
  BarChart,
  ShieldCheck,
  BookDashed,
  HelpCircle,
  BookMarked,
  Lightbulb,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Role = "super_admin" | "admin" | "user";

interface SidebarProps {
  role: Role | string | null;
}

export function Sidebar({ role }: SidebarProps) {
  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Users", href: "/dashboard/users", icon: Users },
    {
      label: "Admins",
      href: "/dashboard/admins",
      icon: ShieldCheck,
      requiredRole: "super_admin" as Role,
    },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
    {
      label: "Dynamic page",
      href: "/dashboard/dynamic-page",
      icon: BookDashed,
    },
    {
      label: "Categories",
      href: "/dashboard/categories",
      icon: BookMarked,
    },
    {
      label: "Questions",
      href: "/dashboard/questions",
      icon: HelpCircle,
    },
    {
      label: "Insights",
      href: "/dashboard/insights",
      icon: Lightbulb,
    },
  ];

  const visibleItems = navItems.filter(
    item => !item.requiredRole || item.requiredRole === role,
  );

  return (
    <aside className="w-64 bg-white rounded-md shadow-2xl bg-background flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 font-bold text-lg">
        <h1 className="text-off-gray font-bold text-2xl">
          {process.env.NEXT_PUBLIC_SITE_NAME as string}
        </h1>
      </div>
      {/* Nav Links */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {visibleItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
