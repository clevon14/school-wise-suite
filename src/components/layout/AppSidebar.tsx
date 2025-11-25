import { 
  Home, 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardCheck, 
  DollarSign,
  FileText,
  Calendar,
  Bus,
  Bell,
  ListChecks,
  Award,
  LogOut,
  Sparkles,
  Settings,
  Shield,
  UserPlus
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "AI Assistant", url: "/ai-assistant", icon: Sparkles },
  { title: "Fine-Tuning", url: "/admin/fine-tuning", icon: Settings },
  { title: "Security", url: "/admin/security", icon: Shield },
  { title: "Teacher Accounts", url: "/admin/teachers", icon: UserPlus },
  { title: "Students", url: "/students", icon: GraduationCap },
  { title: "Teachers", url: "/teachers", icon: Users },
  { title: "Classes", url: "/classes", icon: BookOpen },
  { title: "Subjects", url: "/subjects", icon: FileText },
  { title: "Attendance", url: "/attendance", icon: ClipboardCheck },
  { title: "Timetable", url: "/timetable", icon: Calendar },
  { title: "Tests & Exams", url: "/tests", icon: FileText },
  { title: "Report Cards", url: "/report-cards", icon: Award },
  { title: "Fees", url: "/fees", icon: DollarSign },
  { title: "Transport", url: "/transport", icon: Bus },
  { title: "Quizzes", url: "/quizzes", icon: ListChecks },
  { title: "Syllabus", url: "/syllabus", icon: BookOpen },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Parent Portal", url: "/parent", icon: Users },
];

export function AppSidebar() {
  const { open, isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to logout");
    } else {
      navigate("/auth");
    }
  };

  const handleNavigate = (url: string) => {
    navigate(url);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <div className="flex h-14 md:h-16 items-center border-b px-4 md:px-6">
          <GraduationCap className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          {open && <span className="ml-2 text-base md:text-lg font-semibold">Holy Cross School</span>}
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    onClick={() => handleNavigate(item.url)}
                  >
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 min-h-[44px] md:min-h-[36px]"
                      activeClassName="bg-primary text-primary-foreground"
                    >
                      <item.icon className="h-4 w-4 md:h-4 md:w-4" />
                      <span className="text-sm md:text-base">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto border-t">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleLogout}
                  className="min-h-[44px] md:min-h-[36px]"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm md:text-base">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
