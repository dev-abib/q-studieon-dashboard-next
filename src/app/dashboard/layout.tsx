"use client";
import { Header } from "@/components/layout/dashboard/Header";
import { Sidebar } from "@/components/layout/dashboard/Sidebar";
import { useCurrentUser } from "@/features/auth/hooks/use-get-met";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, isLoading, error } = useCurrentUser();
  console.log(data);

  return (
    <div className="flex p-10 h-screen overflow-hidden">
      <Sidebar />
      <div className="flex pl-5 flex-col flex-1  overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  );
}
