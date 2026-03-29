import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Menu } from "lucide-react";
import { useSchool } from "@/contexts/SchoolContext";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { activeSchool } = useSchool();
  const schoolName = activeSchool?.name || "School Management System";

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto w-full">
          <header className="sticky top-0 z-10 flex h-14 md:h-16 items-center gap-2 md:gap-4 border-b bg-background px-3 md:px-6">
            <SidebarTrigger className="md:hidden">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <SidebarTrigger className="hidden md:flex" />
            <div className="flex items-center gap-2 truncate">
              {activeSchool?.logo_url && (
                <img
                  src={activeSchool.logo_url}
                  alt={schoolName}
                  className="h-8 w-8 rounded-full object-cover"
                />
              )}
              <h1 className="text-base md:text-xl font-semibold truncate">{schoolName}</h1>
            </div>
          </header>
          <div className="p-3 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
