"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, User, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Admin } from "@/features/admin/types/admin.types";
import { useLogOut } from "@/features/auth/hooks/use-logout";
import { cn } from "@/lib/utils";

type HeaderProps = {
  admin: Admin;
};

export function Header({ admin }: HeaderProps) {
  const pathname = usePathname();
  const { mutate: logOutMutation } = useLogOut();

  const handleLogOut = () => {
    logOutMutation();
  };

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((segment) => {
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  });

  return (
    <header className="h-16 rounded-md bg-white shadow-md mb-5 flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            <h1
              className={cn(
                "text-2xl font-semibold",
                index === breadcrumbs.length - 1
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {crumb}
            </h1>
            {index < breadcrumbs.length - 1 && (
              <span className="text-2xl font-semibold text-muted-foreground/50">
                /
              </span>
            )}
          </React.Fragment>
        ))}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-3 px-3 py-1.5 h-auto hover:bg-muted/50 rounded-lg transition-all focus-visible:ring-0"
          >
            <Avatar className="h-9 w-9 border-2 border-primary/10 shadow-sm">
              <AvatarImage
                src={admin.profilePictureURL as string}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/5 text-primary font-bold text-sm">
                {admin.name?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col items-start text-left">
              <span className="text-sm font-bold text-foreground leading-none">
                {admin.name}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">
                {admin.role?.replace("_", " ")}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground ml-1 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 mt-2 p-1.5 shadow-xl border-border/50"
        >
          <div className="px-2 py-1.5 mb-1.5 border-b border-border/50 sm:hidden">
            <p className="text-sm font-bold">{admin.name}</p>
            <p className="text-[10px] text-muted-foreground uppercase">
              {admin.role}
            </p>
          </div>
          <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-primary/5 focus:text-primary rounded-md py-2 px-3">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-primary/5 focus:text-primary rounded-md py-2 px-3">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <div className="my-1 border-t border-border/50" />
          <DropdownMenuItem
            onClick={handleLogOut}
            className="gap-2 cursor-pointer text-destructive focus:bg-destructive/5 focus:text-destructive rounded-md py-2 px-3"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
