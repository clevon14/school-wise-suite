import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Quizzes() {
  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["quizzes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select(`
          *,
          class:classes(name, section),
          subject:subjects(name, code),
          teacher:employees(first_name, last_name)
        `)
        .order("scheduled_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: attempts } = useQuery({
    queryKey: ["quiz-attempts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data } = await supabase
        .from("quiz_attempts")
        .select(`
          *,
          quiz:quizzes(title, total_marks),
          student:students(first_name, last_name)
        `);
      
      return data || [];
    },
  });

  const published = quizzes?.filter(q => q.is_published) || [];
  const drafts = quizzes?.filter(q => !q.is_published) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quizzes & Assessments</h2>
          <p className="text-muted-foreground">Create and manage quizzes for your classes</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </div>

      <Tabs defaultValue="published" className="space-y-4">
        <TabsList>
          <TabsTrigger value="published">Published ({published.length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
          <TabsTrigger value="attempts">Student Attempts ({attempts?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="published" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <p>Loading quizzes...</p>
              </CardContent>
            </Card>
          ) : published.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {published.map((quiz: any) => (
                <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{quiz.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {quiz.subject?.name} ({quiz.subject?.code})
                        </p>
                      </div>
                      <Badge>{quiz.quiz_type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{quiz.class ? `${quiz.class.name} ${quiz.class.section || ''}` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{quiz.duration_minutes} minutes</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm font-medium">Total: {quiz.total_marks} marks</span>
                      <Button variant="outline" size="sm">View Details</Button>
                    </div>
                    {quiz.scheduled_date && (
                      <p className="text-xs text-muted-foreground">
                        Scheduled: {new Date(quiz.scheduled_date).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">No published quizzes yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4">
          {drafts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {drafts.map((quiz: any) => (
                <Card key={quiz.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{quiz.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{quiz.subject?.name}</p>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">Draft</Badge>
                    <div className="mt-4">
                      <Button variant="outline" size="sm" className="w-full">
                        Continue Editing
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">No draft quizzes</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="attempts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Quiz Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              {attempts && attempts.length > 0 ? (
                <div className="space-y-3">
                  {attempts.map((attempt: any) => (
                    <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{attempt.quiz?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {attempt.student ? `${attempt.student.first_name} ${attempt.student.last_name}` : 'Unknown'}
                        </p>
                      </div>
                      <div className="text-right">
                        {attempt.is_graded ? (
                          <Badge>{attempt.marks_obtained}/{attempt.quiz?.total_marks}</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No attempts yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
