"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRight,
  LogOut,
  Settings,
  User,
  HelpCircle,
  ChevronDown,
  ShieldCheck,
  Headphones,
  ShieldAlert,
  FileText,
  DollarSign,
  Search,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Title } from "@/components/typography/Title";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Admin } from "@/features/admin/types/admin.types";
import { useLogOut } from "@/features/auth/hooks/use-logout";

type HeaderProps = {
  admin: Admin;
};

const BREADCRUMB_MAP: Record<string, string> = {
  dashboard: "Overview",
  users: "Users Management",
  admins: "Admins Center",
  settings: "Settings",
  categories: "Onsite Categories",
  questions: "Onsite Questions",
  insights: "Helpful Insights",
  faqs: "FAQs",
  "dynamic-page": "Dynamic Pages",
};

export function Header({ admin }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { mutate: logOutMutation, isPending } = useLogOut();

  const handleLogOut = () => {
    logOutMutation();
  };

  const pathSegments = pathname
    .split("/")
    .filter(Boolean)
    .filter(segment => segment !== "dashboard");

  const currentSegment = pathSegments[pathSegments.length - 1] || "dashboard";
  const pageTitle = BREADCRUMB_MAP[currentSegment] || currentSegment;

  const initials = (admin.name ?? "A")
    .split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return {
          label: "Super Admin",
          icon: ShieldAlert,
          bg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20",
        };
      case "customer_support":
        return {
          label: "Support Member",
          icon: Headphones,
          bg: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20",
        };
      case "content_manager":
        return {
          label: "Content Manager",
          icon: FileText,
          bg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20",
        };
      case "finance":
        return {
          label: "Finance Manager",
          icon: DollarSign,
          bg: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-500/20",
        };
      default:
        return {
          label: "Administrator",
          icon: ShieldCheck,
          bg: "bg-slate-500/10 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300 border-slate-500/20",
        };
    }
  };

  const roleBadge = getRoleBadge(admin.role);
  const RoleBadgeIcon = roleBadge.icon;

  return (
    <header className="h-16 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-100 dark:border-slate-800/80 shadow-sm mb-6 flex items-center justify-between px-6 transition-all">
      {/* ── Breadcrumb / Page Title ── */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/dashboard"
          className="font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          Dashboard
        </Link>

        {pathSegments.map((segment, index) => {
          const href = `/dashboard/${pathSegments.slice(0, index + 1).join("/")}`;
          const isLast = index === pathSegments.length - 1;
          const label = BREADCRUMB_MAP[segment] || segment;

          return (
            <div key={href} className="flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
              {isLast ? (
                <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100 capitalize tracking-tight">
                  {label}
                </h1>
              ) : (
                <Link
                  href={href}
                  className="font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors capitalize"
                >
                  {label}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Center Quick Search Pill ── */}
      <div className="hidden lg:flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/60 px-3.5 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-slate-400 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        <Search className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-medium">Quick search...</span>
        <kbd className="ml-2 font-mono text-[10px] bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-500 font-semibold shadow-2xs">
          ⌘K
        </kbd>
      </div>

      {/* ── Right User Menu ── */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 px-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-all focus-visible:ring-0"
            >
              <div className="relative">
                <Avatar className="h-8 w-8 ring-2 ring-slate-100 dark:ring-slate-800">
                  <AvatarImage src={admin.profilePictureURL || undefined} />
                  <AvatarFallback className="bg-amber-50 text-amber-700 font-semibold text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </div>

              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">
                  {admin.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium capitalize">
                  {admin.role.replace("_", " ")}
                </span>
              </div>

              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-64 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900"
          >
            {/* User Details Header */}
            <div className="px-3 py-3 flex items-center gap-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl mb-1">
              <Avatar className="h-10 w-10 ring-2 ring-slate-200/60 dark:ring-slate-700">
                <AvatarImage src={admin.profilePictureURL || undefined} />
                <AvatarFallback className="bg-amber-50 text-amber-700 font-bold text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {admin.name}
                </span>
                <span className="text-xs text-slate-400 truncate mb-1">
                  {admin.email}
                </span>
                <span
                  className={`inline-flex items-center gap-1 w-max px-2 py-0.5 rounded-md text-[10px] font-semibold border ${roleBadge.bg}`}
                >
                  <RoleBadgeIcon className="h-3 w-3" />
                  {roleBadge.label}
                </span>
              </div>
            </div>

            <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />

            {/* Menu Items */}
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/settings")}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              Settings & Profile
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push("/dashboard/faqs")}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <HelpCircle className="h-4 w-4 text-slate-400" />
              Help & Support
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />

            {/* Logout */}
            <DropdownMenuItem
              onClick={handleLogOut}
              disabled={isPending}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <LogOut className="h-4 w-4 text-rose-500" />
              {isPending ? "Logging out…" : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
