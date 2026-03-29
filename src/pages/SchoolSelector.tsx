import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSchool, School } from "@/contexts/SchoolContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Loader2, Pencil } from "lucide-react";
import { CreateSchoolDialog } from "@/components/super-admin/CreateSchoolDialog";
import { EditSchoolDialog } from "@/components/super-admin/EditSchoolDialog";

export default function SchoolSelector() {
  const { schools, setActiveSchool, loading, isSuperAdmin } = useSchool();
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);

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

        {isSuperAdmin && (
          <div className="flex justify-center">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add School
            </Button>
          </div>
        )}

        {schools.length === 0 ? (
          <Card className="text-center p-8">
            <p className="text-muted-foreground">No schools assigned to your account yet.</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schools.map((school) => (
              <Card
                key={school.id}
                className="hover:shadow-lg transition-shadow cursor-pointer relative"
                onClick={() => handleSelectSchool(school)}
              >
                {isSuperAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSchool(school);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
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

        <CreateSchoolDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />

        {editingSchool && (
          <EditSchoolDialog
            open={!!editingSchool}
            onOpenChange={(open) => !open && setEditingSchool(null)}
            school={editingSchool}
          />
        )}
      </div>
    </div>
  );
}
