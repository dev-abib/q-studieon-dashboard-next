"use client";
import { Header } from "@/components/layout/dashboard/Header";
import { Sidebar } from "@/components/layout/dashboard/Sidebar";
import { Admin } from "@/features/admin/types/admin.types";
import { useCurrentUser } from "@/features/admin/hooks/use-get-met";
import { adminSchema } from "@/features/auth/schema/admin.schema";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, isLoading } = useCurrentUser();

  let admin: Admin | null = null;

  if (!isLoading) {
    admin = adminSchema.parse(data?.data);
  }


  return (
    <div className="flex p-10 h-screen overflow-hidden">
      <Sidebar />
      <div className="flex pl-5 flex-col flex-1  overflow-hidden">
        {admin && <Header admin={admin} />}
        <main className="flex-1 overflow-y-auto p-6 bg-[#f7f6f3]">
          {children}
        </main>
      </div>
    </div>
  );
}
