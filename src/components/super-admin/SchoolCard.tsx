import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Trash2, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSchool } from "@/contexts/SchoolContext";

interface SchoolCardProps {
  school: any;
  onDelete: () => void;
}

export function SchoolCard({ school, onDelete }: SchoolCardProps) {
  const navigate = useNavigate();
  const { setActiveSchool } = useSchool();

  function handleEnter() {
    setActiveSchool(school);
    navigate("/dashboard");
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {school.logo_url ? (
              <img
                src={school.logo_url}
                alt={school.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: school.primary_color || "#7c3aed" }}
              >
                <Building2 className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              <CardTitle className="text-base">{school.name}</CardTitle>
              {school.tagline && (
                <p className="text-xs text-muted-foreground">{school.tagline}</p>
              )}
            </div>
          </div>
          <Badge variant={school.status === "active" ? "default" : "secondary"}>
            {school.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {school.address && (
          <p className="text-sm text-muted-foreground truncate">{school.address}</p>
        )}
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded-full border"
            style={{ backgroundColor: school.primary_color }}
            title="Primary"
          />
          <div
            className="h-4 w-4 rounded-full border"
            style={{ backgroundColor: school.secondary_color }}
            title="Secondary"
          />
          <div
            className="h-4 w-4 rounded-full border"
            style={{ backgroundColor: school.accent_color }}
            title="Accent"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={handleEnter}>
            Enter
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
