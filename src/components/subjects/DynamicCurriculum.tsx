import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, GraduationCap, School, Award, Download, FileText, Languages, Lightbulb, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const iconMap: Record<string, any> = { BookOpen, GraduationCap, School, Award };

interface SubjectGroup {
  category: string;
  items: string[];
}

function useIsAdmin() {
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });
}

// ─── Stages Tab ───
function StagesTab({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newStage, setNewStage] = useState({ name: "", classes: "", icon: "BookOpen", color: "bg-primary/10 text-primary", subjects: "[]", learning_objectives: "" });

  const { data: stages, isLoading } = useQuery({
    queryKey: ["curriculum_stages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("curriculum_stages").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (values: typeof newStage) => {
      const { error } = await supabase.from("curriculum_stages").insert({
        name: values.name,
        classes: values.classes,
        icon: values.icon,
        color: values.color,
        subjects: JSON.parse(values.subjects),
        learning_objectives: values.learning_objectives.split("\n").filter(Boolean),
        sort_order: (stages?.length || 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculum_stages"] }); toast.success("Stage added"); setAdding(false); setNewStage({ name: "", classes: "", icon: "BookOpen", color: "bg-primary/10 text-primary", subjects: "[]", learning_objectives: "" }); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("curriculum_stages").update({
        name: values.name,
        classes: values.classes,
        subjects: typeof values.subjects === "string" ? JSON.parse(values.subjects) : values.subjects,
        learning_objectives: typeof values.learning_objectives === "string" ? values.learning_objectives.split("\n").filter(Boolean) : values.learning_objectives,
      }).eq("id", values.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculum_stages"] }); toast.success("Stage updated"); setEditingId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("curriculum_stages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculum_stages"] }); toast.success("Stage deleted"); setDeleteId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setAdding(!adding)}>
            <Plus className="h-4 w-4 mr-1" /> Add Stage
          </Button>
        </div>
      )}

      {adding && isAdmin && (
        <Card className="border-dashed border-2">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Stage name" value={newStage.name} onChange={(e) => setNewStage({ ...newStage, name: e.target.value })} />
              <Input placeholder="Classes (e.g. Class 1 – 3)" value={newStage.classes} onChange={(e) => setNewStage({ ...newStage, classes: e.target.value })} />
            </div>
            <Textarea placeholder='Subjects JSON: [{"category":"Math","items":["Algebra"]}]' value={newStage.subjects} onChange={(e) => setNewStage({ ...newStage, subjects: e.target.value })} rows={3} />
            <Textarea placeholder="Learning objectives (one per line)" value={newStage.learning_objectives} onChange={(e) => setNewStage({ ...newStage, learning_objectives: e.target.value })} rows={3} />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addMutation.mutate(newStage)} disabled={!newStage.name || addMutation.isPending}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {stages?.map((stage) => {
          const Icon = iconMap[stage.icon] || BookOpen;
          const subjects = (stage.subjects as unknown as SubjectGroup[]) || [];
          const objectives = (stage.learning_objectives as string[]) || [];
          const isEditing = editingId === stage.id;

          if (isEditing && editForm) {
            return (
              <Card key={stage.id} className="border-2 border-primary/30">
                <CardContent className="pt-4 space-y-3">
                  <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Stage name" />
                  <Input value={editForm.classes} onChange={(e) => setEditForm({ ...editForm, classes: e.target.value })} placeholder="Classes" />
                  <Textarea value={editForm.subjects} onChange={(e) => setEditForm({ ...editForm, subjects: e.target.value })} rows={4} placeholder="Subjects JSON" />
                  <Textarea value={editForm.learning_objectives} onChange={(e) => setEditForm({ ...editForm, learning_objectives: e.target.value })} rows={3} placeholder="Learning objectives (one per line)" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateMutation.mutate(editForm)} disabled={updateMutation.isPending}><Check className="h-4 w-4 mr-1" /> Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4 mr-1" /> Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            );
          }

          return (
            <Card key={stage.id} className="border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${stage.color}`}><Icon className="h-4 w-4" /></div>
                    {stage.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{stage.classes}</Badge>
                    {isAdmin && (
                      <>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingId(stage.id); setEditForm({ id: stage.id, name: stage.name, classes: stage.classes, subjects: JSON.stringify(subjects, null, 2), learning_objectives: objectives.join("\n") }); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(stage.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {subjects.map((group) => (
                  <div key={group.category}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{group.category}</p>
                    <ul className="space-y-0.5">
                      {group.items.map((item) => (
                        <li key={item} className="text-sm flex items-start gap-1.5"><span className="text-primary mt-1.5 shrink-0">•</span>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                {objectives.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Learning Objectives</p>
                    <ul className="space-y-0.5">
                      {objectives.map((obj) => (
                        <li key={obj} className="text-sm flex items-start gap-1.5 text-muted-foreground"><span className="text-accent-foreground mt-1.5 shrink-0">›</span>{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stage?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this curriculum stage.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Language Policy Tab ───
function LanguagePolicyTab({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [newRow, setNewRow] = useState({ combination: "", first_language: "", second_language: "", third_language: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: rows } = useQuery({
    queryKey: ["curriculum_language_policy"],
    queryFn: async () => {
      const { data, error } = await supabase.from("curriculum_language_policy").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (values: typeof newRow) => {
      const { error } = await supabase.from("curriculum_language_policy").insert({ ...values, sort_order: (rows?.length || 0) + 1 });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculum_language_policy"] }); toast.success("Added"); setAdding(false); setNewRow({ combination: "", first_language: "", second_language: "", third_language: "" }); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: any) => {
      const { id, ...rest } = values;
      const { error } = await supabase.from("curriculum_language_policy").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculum_language_policy"] }); toast.success("Updated"); setEditingId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("curriculum_language_policy").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculum_language_policy"] }); toast.success("Deleted"); setDeleteId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Three-Language Formula (KCF 2007)</CardTitle>
            <p className="text-sm text-muted-foreground">Official language combinations for Classes 6–10</p>
          </div>
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={() => setAdding(!adding)}><Plus className="h-4 w-4 mr-1" /> Add</Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Combination</TableHead>
              <TableHead>First Language</TableHead>
              <TableHead>Second Language</TableHead>
              <TableHead>Third Language</TableHead>
              {isAdmin && <TableHead className="w-20">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {adding && (
              <TableRow className="bg-muted/20">
                <TableCell><Input value={newRow.combination} onChange={(e) => setNewRow({ ...newRow, combination: e.target.value })} placeholder="e.g. D" className="h-8 w-16" /></TableCell>
                <TableCell><Input value={newRow.first_language} onChange={(e) => setNewRow({ ...newRow, first_language: e.target.value })} className="h-8" /></TableCell>
                <TableCell><Input value={newRow.second_language} onChange={(e) => setNewRow({ ...newRow, second_language: e.target.value })} className="h-8" /></TableCell>
                <TableCell><Input value={newRow.third_language} onChange={(e) => setNewRow({ ...newRow, third_language: e.target.value })} className="h-8" /></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => addMutation.mutate(newRow)} disabled={addMutation.isPending}><Check className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setAdding(false)}><X className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {rows?.map((row) => editingId === row.id && editForm ? (
              <TableRow key={row.id} className="bg-muted/20">
                <TableCell><Input value={editForm.combination} onChange={(e) => setEditForm({ ...editForm, combination: e.target.value })} className="h-8 w-16" /></TableCell>
                <TableCell><Input value={editForm.first_language} onChange={(e) => setEditForm({ ...editForm, first_language: e.target.value })} className="h-8" /></TableCell>
                <TableCell><Input value={editForm.second_language} onChange={(e) => setEditForm({ ...editForm, second_language: e.target.value })} className="h-8" /></TableCell>
                <TableCell><Input value={editForm.third_language} onChange={(e) => setEditForm({ ...editForm, third_language: e.target.value })} className="h-8" /></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate(editForm)}><Check className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow key={row.id}>
                <TableCell><Badge variant="secondary">{row.combination}</Badge></TableCell>
                <TableCell className="font-medium">{row.first_language}</TableCell>
                <TableCell>{row.second_language}</TableCell>
                <TableCell className="text-sm">{row.third_language}</TableCell>
                {isAdmin && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingId(row.id); setEditForm({ id: row.id, combination: row.combination, first_language: row.first_language, second_language: row.second_language, third_language: row.third_language }); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(row.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 p-3 rounded-md bg-muted/50 text-sm text-muted-foreground space-y-1">
          <p>• First Language is studied from Class 1 onward; Second Language from Class 3 or 4; Third Language from Class 6.</p>
          <p>• Kannada is compulsory either as First, Second, or Third Language for all students in Karnataka.</p>
        </div>
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this combination?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// ─── Guidelines Tab ───
function GuidelinesTab({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [newGuideline, setNewGuideline] = useState({ title: "", description: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: guidelines } = useQuery({
    queryKey: ["curriculum_guidelines"],
    queryFn: async () => {
      const { data, error } = await supabase.from("curriculum_guidelines").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (values: typeof newGuideline) => {
      const { error } = await supabase.from("curriculum_guidelines").insert({ ...values, sort_order: (guidelines?.length || 0) + 1 });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculum_guidelines"] }); toast.success("Guideline added"); setAdding(false); setNewGuideline({ title: "", description: "" }); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: any) => {
      const { id, ...rest } = values;
      const { error } = await supabase.from("curriculum_guidelines").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculum_guidelines"] }); toast.success("Updated"); setEditingId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("curriculum_guidelines").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["curriculum_guidelines"] }); toast.success("Deleted"); setDeleteId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setAdding(!adding)}><Plus className="h-4 w-4 mr-1" /> Add Guideline</Button>
        </div>
      )}

      {adding && (
        <Card className="border-dashed border-2">
          <CardContent className="pt-4 space-y-3">
            <Input placeholder="Guideline title" value={newGuideline.title} onChange={(e) => setNewGuideline({ ...newGuideline, title: e.target.value })} />
            <Textarea placeholder="Description" value={newGuideline.description} onChange={(e) => setNewGuideline({ ...newGuideline, description: e.target.value })} rows={3} />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addMutation.mutate(newGuideline)} disabled={!newGuideline.title || addMutation.isPending}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {guidelines?.map((g) => editingId === g.id && editForm ? (
          <Card key={g.id} className="border-2 border-primary/30">
            <CardContent className="pt-4 space-y-3">
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => updateMutation.mutate(editForm)}><Check className="h-4 w-4 mr-1" /> Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4 mr-1" /> Cancel</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card key={g.id} className="border">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-sm mb-1">{g.title}</h4>
                  <p className="text-sm text-muted-foreground">{g.description}</p>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingId(g.id); setEditForm({ id: g.id, title: g.title, description: g.description }); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(g.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Source: Karnataka Curriculum Framework 2007 (KCF 2007) —{" "}
        <a href="/documents/KCF2007-EngVer.pdf" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Download full document</a>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Guideline?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Main Component ───
export function DynamicCurriculum() {
  const { data: isAdmin } = useIsAdmin();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              KSEAB Curriculum Structure (Karnataka)
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Subject structure for Classes 1–10 under KSEAB — based on KCF 2007
              {isAdmin && <Badge variant="secondary" className="ml-2">Admin: Editable</Badge>}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/documents/KCF2007-EngVer.pdf" target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-1" /> KCF 2007 PDF
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="subjects" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="subjects" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Subject Structure</TabsTrigger>
            <TabsTrigger value="language" className="gap-1.5"><Languages className="h-3.5 w-3.5" /> Language Policy</TabsTrigger>
            <TabsTrigger value="guidelines" className="gap-1.5"><Lightbulb className="h-3.5 w-3.5" /> Guidelines</TabsTrigger>
          </TabsList>
          <TabsContent value="subjects"><StagesTab isAdmin={!!isAdmin} /></TabsContent>
          <TabsContent value="language"><LanguagePolicyTab isAdmin={!!isAdmin} /></TabsContent>
          <TabsContent value="guidelines"><GuidelinesTab isAdmin={!!isAdmin} /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
