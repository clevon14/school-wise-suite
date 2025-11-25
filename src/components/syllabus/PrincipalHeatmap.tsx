import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PrincipalHeatmap() {
  const { data: heatmapData, isLoading } = useQuery({
    queryKey: ["syllabusHeatmap"],
    queryFn: async () => {
      // Get all classes
      const { data: classes, error: classError } = await supabase
        .from("classes")
        .select("id, name, section")
        .order("name");

      if (classError) throw classError;

      // Get all subjects
      const { data: subjects, error: subjectError } = await supabase
        .from("subjects")
        .select("id, name")
        .order("name");

      if (subjectError) throw subjectError;

      // Get syllabus completion data
      const completionMap: Record<string, Record<string, number>> = {};

      for (const cls of classes || []) {
        completionMap[cls.id] = {};

        for (const subject of subjects || []) {
          // Get total topics
          const { data: topics, error: topicsError } = await supabase
            .from("syllabus_topics")
            .select("id, planned_hours")
            .eq("class_id", cls.id)
            .eq("subject_id", subject.id);

          if (topicsError) continue;

          if (!topics || topics.length === 0) {
            completionMap[cls.id][subject.id] = 0;
            continue;
          }

          // Calculate weighted progress based on hours
          let totalPlannedHours = 0;
          let totalCompletedHours = 0;

          for (const topic of topics) {
            totalPlannedHours += topic.planned_hours || 0;

            const { data: progress } = await supabase
              .from("syllabus_progress")
              .select("hours_taught")
              .eq("syllabus_topic_id", topic.id)
              .maybeSingle();

            if (progress) {
              totalCompletedHours += progress.hours_taught || 0;
            }
          }

          const percentage =
            totalPlannedHours > 0
              ? Math.round((totalCompletedHours / totalPlannedHours) * 100)
              : 0;

          completionMap[cls.id][subject.id] = percentage;
        }
      }

      return { classes, subjects, completionMap };
    },
  });

  const getHeatColor = (percentage: number) => {
    if (percentage === 0) return "bg-gray-100";
    if (percentage < 25) return "bg-red-200";
    if (percentage < 50) return "bg-orange-200";
    if (percentage < 75) return "bg-yellow-200";
    if (percentage < 100) return "bg-lime-200";
    return "bg-green-300";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Syllabus Completion Heatmap</CardTitle>
        </CardHeader>
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Syllabus Completion Heatmap</CardTitle>
        <p className="text-sm text-muted-foreground">
          Class-wise and subject-wise completion percentages
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 bg-muted font-semibold text-left sticky left-0 z-10">
                  Class / Subject
                </th>
                {heatmapData?.subjects?.map((subject: any) => (
                  <th key={subject.id} className="border p-2 bg-muted font-semibold text-center">
                    {subject.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData?.classes?.map((cls: any) => (
                <tr key={cls.id}>
                  <td className="border p-2 font-medium sticky left-0 bg-background z-10">
                    {cls.name} {cls.section && `- ${cls.section}`}
                  </td>
                  {heatmapData?.subjects?.map((subject: any) => {
                    const percentage = heatmapData.completionMap[cls.id][subject.id] || 0;
                    return (
                      <td
                        key={subject.id}
                        className={`border p-2 text-center font-semibold ${getHeatColor(
                          percentage
                        )}`}
                      >
                        {percentage}%
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-4 mt-4 items-center text-sm">
          <span className="font-medium">Legend:</span>
          <div className="flex gap-2 items-center">
            <div className="w-6 h-6 bg-gray-100 border" />
            <span>0%</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-6 h-6 bg-red-200 border" />
            <span>1-24%</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-6 h-6 bg-orange-200 border" />
            <span>25-49%</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-6 h-6 bg-yellow-200 border" />
            <span>50-74%</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-6 h-6 bg-lime-200 border" />
            <span>75-99%</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-6 h-6 bg-green-300 border" />
            <span>100%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
