import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CurrentRoleInfo = {
  userId: string | null;
  role: "admin" | "teacher" | "parent" | "student" | null;
  employeeId: string | null;
  studentId: string | null;
  schoolId: string | null;
};

export function useCurrentRole() {
  return useQuery<CurrentRoleInfo>({
    queryKey: ["current-role-info"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { userId: null, role: null, employeeId: null, studentId: null, schoolId: null };

      const [{ data: roles }, { data: emp }, { data: studentRow }, { data: userSchool }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("employees").select("id, school_id").eq("user_id", user.id).maybeSingle(),
        supabase.from("students").select("id, school_id, class_id").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_schools").select("school_id").eq("user_id", user.id).eq("is_default", true).maybeSingle(),
      ]);

      const roleList = (roles ?? []).map((r: any) => r.role);
      let role: CurrentRoleInfo["role"] = null;
      if (roleList.includes("admin") || roleList.includes("super_admin")) role = "admin";
      else if (roleList.includes("teacher")) role = "teacher";
      else if (roleList.includes("parent")) role = "parent";
      else if (roleList.includes("student")) role = "student";

      return {
        userId: user.id,
        role,
        employeeId: emp?.id ?? null,
        studentId: studentRow?.id ?? null,
        schoolId: userSchool?.school_id ?? emp?.school_id ?? studentRow?.school_id ?? null,
      };
    },
    staleTime: 60_000,
  });
}
