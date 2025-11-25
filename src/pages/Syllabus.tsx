import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, Clock, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Syllabus() {
  const { data: topics, isLoading } = useQuery({
    queryKey: ["syllabus-topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("syllabus_topics")
        .select(`
          *,
          class:classes(name, section),
          subject:subjects(name, code),
          progress:syllabus_progress(
            status,
            hours_taught,
            completion_date,
            teacher:employees(first_name, last_name)
          )
        `)
        .order("sequence_order");
      
      if (error) throw error;
      return data;
    },
  });

  const calculateProgress = (topics: any[] = []) => {
    if (topics.length === 0) return 0;
    const completed = topics.filter((t: any) => 
      t.progress && t.progress.some((p: any) => p.status === 'completed')
    ).length;
    return Math.round((completed / topics.length) * 100);
  };

  const groupedByClass = topics?.reduce((acc: any, topic: any) => {
    const classKey = topic.class ? `${topic.class.name} ${topic.class.section || ''}` : 'Unassigned';
    if (!acc[classKey]) acc[classKey] = [];
    acc[classKey].push(topic);
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Syllabus Tracker</h2>
          <p className="text-muted-foreground">Monitor curriculum progress across all classes</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Topic
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Topics</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topics?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topics?.filter((t: any) => 
                t.progress && t.progress.some((p: any) => p.status === 'completed')
              ).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topics?.filter((t: any) => 
                t.progress && t.progress.some((p: any) => p.status === 'in_progress')
              ).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <p>Loading syllabus...</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={Object.keys(groupedByClass)[0]} className="space-y-4">
          <TabsList>
            {Object.keys(groupedByClass).map((classKey) => (
              <TabsTrigger key={classKey} value={classKey}>
                {classKey}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(groupedByClass).map(([classKey, classTopics]: [string, any]) => (
            <TabsContent key={classKey} value={classKey} className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Overall Progress</CardTitle>
                    <span className="text-sm font-medium">{calculateProgress(classTopics)}%</span>
                  </div>
                  <Progress value={calculateProgress(classTopics)} className="mt-2" />
                </CardHeader>
              </Card>

              <div className="space-y-3">
                {classTopics.map((topic: any) => {
                  const progress = topic.progress?.[0];
                  const status = progress?.status || 'not_started';
                  
                  return (
                    <Card key={topic.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-muted-foreground">
                                Topic {topic.sequence_order}
                              </span>
                              <h4 className="font-semibold">{topic.topic_name}</h4>
                            </div>
                            
                            <p className="text-sm text-muted-foreground">{topic.description}</p>
                            
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground">
                                Subject: <span className="font-medium">{topic.subject?.name}</span>
                              </span>
                              {topic.planned_hours && (
                                <span className="text-muted-foreground">
                                  Planned: <span className="font-medium">{topic.planned_hours}h</span>
                                </span>
                              )}
                              {progress?.hours_taught && (
                                <span className="text-muted-foreground">
                                  Taught: <span className="font-medium">{progress.hours_taught}h</span>
                                </span>
                              )}
                            </div>

                            {progress?.teacher && (
                              <p className="text-xs text-muted-foreground">
                                Teacher: {progress.teacher.first_name} {progress.teacher.last_name}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <Badge
                              variant={
                                status === 'completed' ? 'default' :
                                status === 'in_progress' ? 'secondary' :
                                'outline'
                              }
                            >
                              {status.replace('_', ' ')}
                            </Badge>
                            
                            {progress?.completion_date && (
                              <span className="text-xs text-muted-foreground">
                                Completed: {new Date(progress.completion_date).toLocaleDateString()}
                              </span>
                            )}
                            
                            <Button variant="outline" size="sm">Update Progress</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
