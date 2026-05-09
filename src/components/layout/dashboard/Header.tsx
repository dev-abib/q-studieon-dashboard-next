// components/header.tsx
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

type HeaderProps = {
  admin: Admin;
};

export function Header({ admin }: HeaderProps) {
  const { mutate: logOutMutation, data, error, isPending } = useLogOut();
  const handleLogOut = () => {
    logOutMutation();
  };
  return (
    <header className="h-16 rounded-md bg-white shadow-md mb-5  flex items-center justify-between px-6">
      <h1 className="text-sm font-semibold text-muted-foreground">Dashboard</h1>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={admin.profilePictureURL as string} />
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogOut}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
