import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Plus, Trash2, Eye, EyeOff, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface TrainingExample {
  id: string;
  prompt: string;
  completion: string;
  category: string;
  is_anonymized: boolean;
  status: string;
  created_at: string;
}

interface FineTuningConfig {
  id: string;
  use_fine_tuned_model: boolean;
  fine_tuned_model_id: string | null;
  base_model: string;
  temperature: number;
  max_tokens: number;
  notes: string | null;
}

export default function AdminFineTuning() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newExample, setNewExample] = useState({ prompt: "", completion: "", category: "student_summary" });
  const [showAnonymized, setShowAnonymized] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  // Fetch training examples
  const { data: examples = [], isLoading: examplesLoading } = useQuery({
    queryKey: ["training-examples"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_examples")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TrainingExample[];
    },
  });

  // Fetch config
  const { data: config } = useQuery({
    queryKey: ["fine-tuning-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fine_tuning_config")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data as FineTuningConfig;
    },
  });

  // Add example mutation
  const addExampleMutation = useMutation({
    mutationFn: async (example: typeof newExample) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single();

      const { error } = await supabase.from("training_examples").insert({
        ...example,
        created_by: employee?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-examples"] });
      setNewExample({ prompt: "", completion: "", category: "student_summary" });
      toast({ title: "Example added successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    },
  });

  // Delete example mutation
  const deleteExampleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("training_examples").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-examples"] });
      toast({ title: "Example deleted" });
    },
  });

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (updates: Partial<FineTuningConfig>) => {
      if (!config?.id) throw new Error("Config not found");
      const { error } = await supabase
        .from("fine_tuning_config")
        .update(updates)
        .eq("id", config.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fine-tuning-config"] });
      toast({ title: "Configuration updated" });
    },
  });

  // Anonymize example
  const anonymizeExample = async (example: TrainingExample) => {
    try {
      const { data, error } = await supabase.rpc("anonymize_training_example", {
        example_text: JSON.stringify({ prompt: example.prompt, completion: example.completion }),
      });
      if (error) throw error;
      return JSON.parse(data);
    } catch (error) {
      toast({ title: "Error anonymizing", variant: "destructive" });
      return null;
    }
  };

  // Export dataset
  const exportDataset = async () => {
    try {
      const approvedExamples = examples.filter((ex) => ex.status === "approved");
      const jsonlLines = await Promise.all(
        approvedExamples.map(async (ex) => {
          const anonymized = await anonymizeExample(ex);
          return JSON.stringify({
            messages: [
              { role: "system", content: "You are Holy Cross School Assistant. Always be accurate, concise, and helpful." },
              { role: "user", content: anonymized?.prompt || ex.prompt },
              { role: "assistant", content: anonymized?.completion || ex.completion },
            ],
          });
        })
      );

      const jsonlContent = jsonlLines.join("\n");
      const blob = new Blob([jsonlContent], { type: "application/jsonl" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `holycrossschool-finetune-${new Date().toISOString().split("T")[0]}.jsonl`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Dataset exported successfully" });
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fine-Tuning Dataset Builder</h1>
          <p className="text-muted-foreground">Create and manage training examples for custom AI models</p>
        </div>
        <Dialog open={configOpen} onOpenChange={setConfigOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Model Config
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fine-Tuning Configuration</DialogTitle>
              <DialogDescription>Configure model settings for RAG pipeline</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="use-fine-tuned">Use Fine-Tuned Model</Label>
                <Switch
                  id="use-fine-tuned"
                  checked={config?.use_fine_tuned_model || false}
                  onCheckedChange={(checked) =>
                    updateConfigMutation.mutate({ use_fine_tuned_model: checked })
                  }
                />
              </div>
              <div>
                <Label htmlFor="model-id">Fine-Tuned Model ID</Label>
                <Input
                  id="model-id"
                  placeholder="ft:gpt-3.5-turbo:..."
                  value={config?.fine_tuned_model_id || ""}
                  onChange={(e) =>
                    updateConfigMutation.mutate({ fine_tuned_model_id: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="base-model">Base Model</Label>
                <Input
                  id="base-model"
                  value={config?.base_model || "google/gemini-2.5-flash"}
                  onChange={(e) => updateConfigMutation.mutate({ base_model: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setConfigOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="create">
        <TabsList>
          <TabsTrigger value="create">Create Examples</TabsTrigger>
          <TabsTrigger value="manage">Manage Dataset ({examples.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Training Example</CardTitle>
              <CardDescription>Create instruction-response pairs for fine-tuning</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newExample.category}
                  onValueChange={(value) => setNewExample({ ...newExample, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student_summary">Student Summary</SelectItem>
                    <SelectItem value="class_overview">Class Overview</SelectItem>
                    <SelectItem value="intervention">Intervention Recommendation</SelectItem>
                    <SelectItem value="parent_communication">Parent Communication</SelectItem>
                    <SelectItem value="attendance_analysis">Attendance Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="prompt">Prompt (Instruction)</Label>
                <Textarea
                  id="prompt"
                  placeholder="Summarize student performance for teacher review"
                  value={newExample.prompt}
                  onChange={(e) => setNewExample({ ...newExample, prompt: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="completion">Completion (Response)</Label>
                <Textarea
                  id="completion"
                  placeholder="Student John Doe — Attendance 82% this month..."
                  value={newExample.completion}
                  onChange={(e) => setNewExample({ ...newExample, completion: e.target.value })}
                  rows={5}
                />
              </div>
              <Button onClick={() => addExampleMutation.mutate(newExample)} disabled={!newExample.prompt || !newExample.completion}>
                <Plus className="h-4 w-4 mr-2" />
                Add Example
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <div className="flex items-center justify-between">
            <Button onClick={() => setShowAnonymized(!showAnonymized)} variant="outline" size="sm">
              {showAnonymized ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showAnonymized ? "Hide" : "Show"} Anonymized
            </Button>
            <Button onClick={exportDataset} disabled={examples.filter((ex) => ex.status === "approved").length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export JSONL ({examples.filter((ex) => ex.status === "approved").length} approved)
            </Button>
          </div>
          {examplesLoading ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-3">
              {examples.map((example) => (
                <Card key={example.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">{example.category}</span>
                        <div className="flex gap-2">
                          <Select
                            value={example.status}
                            onValueChange={(status) => {
                              supabase.from("training_examples").update({ status }).eq("id", example.id).then(() => {
                                queryClient.invalidateQueries({ queryKey: ["training-examples"] });
                              });
                            }}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="exported">Exported</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" onClick={() => deleteExampleMutation.mutate(example.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Prompt:</p>
                        <p className="text-sm text-muted-foreground">{example.prompt}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Completion:</p>
                        <p className="text-sm text-muted-foreground">{example.completion}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Example Templates</CardTitle>
              <CardDescription>Common patterns for training data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Student Summary Template:</h4>
                <pre className="bg-muted p-3 rounded text-sm">
{`Prompt: "Summarize student <NAME> for teacher review"
Completion: "Student <NAME> — Attendance <XX>% this month; last 3 tests avg <XX>%; tuition <STATUS>; bus <STATUS>. Recommend <ACTION>."`}
                </pre>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Class Overview Template:</h4>
                <pre className="bg-muted p-3 rounded text-sm">
{`Prompt: "Give me an overview of Class <X> Section <Y>"
Completion: "Class <X>-<Y> has <N> students. Avg attendance <XX>%, avg grade <XX>%. <N> students at-risk. Fee collection <XX>%."`}
                </pre>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Intervention Template:</h4>
                <pre className="bg-muted p-3 rounded text-sm">
{`Prompt: "What intervention does student <NAME> need?"
Completion: "Student <NAME> shows <PATTERN>. Recommend: <ACTION> and monitor weekly."`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
