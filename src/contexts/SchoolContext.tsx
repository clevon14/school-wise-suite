import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface School {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  tagline: string | null;
  academic_year: string | null;
  status: string;
}

interface SchoolContextType {
  activeSchool: School | null;
  schools: School[];
  schoolId: string | null;
  setActiveSchool: (school: School) => void;
  loading: boolean;
  isSuperAdmin: boolean;
}

const SchoolContext = createContext<SchoolContextType>({
  activeSchool: null,
  schools: [],
  schoolId: null,
  setActiveSchool: () => {},
  loading: true,
  isSuperAdmin: false,
});

export function useSchool() {
  return useContext(SchoolContext);
}

function applySchoolBranding(school: School | null) {
  const root = document.documentElement;
  if (school?.primary_color) {
    // Convert hex to HSL for CSS variable compatibility
    const hsl = hexToHSL(school.primary_color);
    if (hsl) root.style.setProperty("--primary", hsl);
  } else {
    root.style.removeProperty("--primary");
  }
  if (school?.secondary_color) {
    const hsl = hexToHSL(school.secondary_color);
    if (hsl) root.style.setProperty("--secondary", hsl);
  } else {
    root.style.removeProperty("--secondary");
  }
  if (school?.accent_color) {
    const hsl = hexToHSL(school.accent_color);
    if (hsl) root.style.setProperty("--accent", hsl);
  } else {
    root.style.removeProperty("--accent");
  }
}

function hexToHSL(hex: string): string | null {
  hex = hex.replace("#", "");
  if (hex.length !== 6) return null;
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [activeSchool, setActiveSchoolState] = useState<School | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    loadSchools();
  }, []);

  useEffect(() => {
    applySchoolBranding(activeSchool);
  }, [activeSchool]);

  async function loadSchools() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Check if super admin
      const { data: superAdminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "super_admin" as any)
        .maybeSingle();

      const isSA = !!superAdminRole;
      setIsSuperAdmin(isSA);

      if (isSA) {
        // Super admins see all schools
        const { data: allSchools } = await supabase
          .from("schools")
          .select("*")
          .eq("status", "active")
          .order("name");
        setSchools((allSchools as any as School[]) || []);
      } else {
        // Regular users see only assigned schools
        const { data: userSchools } = await supabase
          .from("user_schools")
          .select("school_id, is_default, schools(*)")
          .eq("user_id", session.user.id);

        const mappedSchools = (userSchools || [])
          .map((us: any) => us.schools)
          .filter(Boolean) as School[];
        setSchools(mappedSchools);

        // Auto-select default school
        const defaultMapping = (userSchools || []).find((us: any) => us.is_default);
        if (defaultMapping) {
          setActiveSchoolState(defaultMapping.schools as any as School);
        } else if (mappedSchools.length === 1) {
          setActiveSchoolState(mappedSchools[0]);
        }
      }

      // Try to restore from localStorage
      const savedSchoolId = localStorage.getItem("activeSchoolId");
      if (savedSchoolId) {
        const { data: savedSchool } = await supabase
          .from("schools")
          .select("*")
          .eq("id", savedSchoolId)
          .maybeSingle();
        if (savedSchool) {
          setActiveSchoolState(savedSchool as any as School);
        }
      }
    } catch (error) {
      console.error("Error loading schools:", error);
    } finally {
      setLoading(false);
    }
  }

  function setActiveSchool(school: School) {
    setActiveSchoolState(school);
    localStorage.setItem("activeSchoolId", school.id);
  }

  return (
    <SchoolContext.Provider
      value={{
        activeSchool,
        schools,
        schoolId: activeSchool?.id || null,
        setActiveSchool,
        loading,
        isSuperAdmin,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
}
