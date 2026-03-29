import { useNavigate } from "react-router-dom";
import { useSchool, School } from "@/contexts/SchoolContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function SchoolSelector() {
  const { schools, setActiveSchool, loading, isSuperAdmin } = useSchool();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  function handleSelectSchool(school: School) {
    setActiveSchool(school);
    navigate("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Select School</h1>
          <p className="text-muted-foreground">Choose a school to manage</p>
        </div>

        {schools.length === 0 ? (
          <Card className="text-center p-8">
            <p className="text-muted-foreground mb-4">No schools assigned to your account yet.</p>
            {isSuperAdmin && (
              <Button onClick={() => navigate("/super-admin")}>
                <Plus className="mr-2 h-4 w-4" />
                Create a School
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schools.map((school) => (
              <Card
                key={school.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleSelectSchool(school)}
              >
                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-3">
                    {school.logo_url ? (
                      <img
                        src={school.logo_url}
                        alt={school.name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-16 w-16 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: school.primary_color || "hsl(var(--primary))" }}
                      >
                        <Building2 className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg">{school.name}</CardTitle>
                  {school.tagline && (
                    <CardDescription>{school.tagline}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="text-center">
                  <Button className="w-full" variant="outline">
                    Enter School
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {isSuperAdmin && (
          <div className="text-center">
            <Button variant="outline" onClick={() => navigate("/super-admin")}>
              <Building2 className="mr-2 h-4 w-4" />
              Super Admin Portal
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
