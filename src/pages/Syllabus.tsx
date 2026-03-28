import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddTopicDialog } from "@/components/syllabus/AddTopicDialog";
import { TopicProgressCard } from "@/components/syllabus/TopicProgressCard";
import { PrincipalHeatmap } from "@/components/syllabus/PrincipalHeatmap";
import { KSEABCurriculum } from "@/components/subjects/KSEABCurriculum";

export default function Syllabus() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Get current user to determine if they're a teacher
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      return { ...user, employeeId: employee?.id };
    },
  });

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: topics, isLoading } = useQuery({
    queryKey: ["syllabusTopics", selectedClass, selectedSubject, selectedMonth],
    queryFn: async () => {
      let query = supabase
        .from("syllabus_topics")
        .select(`
          *,
          class:classes(name, section),
          subject:subjects(name),
          progress:syllabus_progress(*)
        `)
        .order("term", { ascending: false });

      if (selectedClass) query = query.eq("class_id", selectedClass);
      if (selectedSubject) query = query.eq("subject_id", selectedSubject);
      if (selectedMonth) query = query.eq("term", selectedMonth);

      const { data, error } = await query;
      if (error) throw error;

      // Flatten progress array to single object
      return data?.map(topic => ({
        ...topic,
        progress: topic.progress?.[0] || null
      }));
    },
    enabled: !!selectedClass || !!selectedSubject,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Syllabus Tracker</h2>
          <p className="text-muted-foreground">Track monthly topics and completion progress</p>
        </div>
        <AddTopicDialog />
      </div>

      <Tabs defaultValue="tracker">
        <TabsList>
          <TabsTrigger value="tracker">Topic Tracker</TabsTrigger>
          <TabsTrigger value="heatmap">Completion Heatmap</TabsTrigger>
          <TabsTrigger value="curriculum">KCF 2007 Curriculum</TabsTrigger>
        </TabsList>

        <TabsContent value="tracker" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} {cls.section && `- ${cls.section}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects?.map((subject: any) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            />
          </div>

          {isLoading ? (
            <p>Loading topics...</p>
          ) : topics && topics.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {topics.map((topic: any) => (
                <TopicProgressCard
                  key={topic.id}
                  topic={topic}
                  teacherId={currentUser?.employeeId || ""}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No topics found. Select filters or add a new topic.
            </p>
          )}
        </TabsContent>

        <TabsContent value="heatmap">
          <PrincipalHeatmap />
        </TabsContent>
      </Tabs>
    </div>
  );
}
