import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TopicProgressCardProps {
  topic: any;
  teacherId: string;
}

export function TopicProgressCard({ topic, teacherId }: TopicProgressCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(topic.progress?.status || "not_started");
  const [hoursTaught, setHoursTaught] = useState(topic.progress?.hours_taught || 0);
  const [notes, setNotes] = useState(topic.progress?.notes || "");

  const calculateProgress = () => {
    if (!topic.planned_hours) return 0;
    const current = topic.progress?.hours_taught || 0;
    return Math.min(100, Math.round((current / topic.planned_hours) * 100));
  };

  const updateProgress = useMutation({
    mutationFn: async () => {
      const progressData = {
        syllabus_topic_id: topic.id,
        teacher_id: teacherId,
        status,
        hours_taught: Number(hoursTaught),
        notes,
        completion_date: status === "completed" ? new Date().toISOString() : null,
      };

      if (topic.progress?.id) {
        const { error } = await supabase
          .from("syllabus_progress")
          .update(progressData)
          .eq("id", topic.progress.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("syllabus_progress")
          .insert([progressData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["syllabusTopics"] });
      toast({ title: "Success", description: "Progress updated" });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success">Completed</Badge>;
      case "in_progress":
        return <Badge variant="secondary">In Progress</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{topic.topic_name}</h3>
          <p className="text-sm text-muted-foreground">{topic.description}</p>
          <div className="flex gap-2 mt-2">
            {getStatusBadge(topic.progress?.status || "not_started")}
            <Badge variant="outline">
              {topic.planned_hours} hours planned
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span className="font-semibold">{calculateProgress()}%</span>
        </div>
        <Progress value={calculateProgress()} />
        <p className="text-xs text-muted-foreground">
          {topic.progress?.hours_taught || 0} / {topic.planned_hours} hours completed
        </p>
      </div>

      {isEditing ? (
        <div className="space-y-3 pt-2 border-t">
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Hours Taught</label>
            <Input
              type="number"
              value={hoursTaught}
              onChange={(e) => setHoursTaught(Number(e.target.value))}
              max={topic.planned_hours}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add progress notes..."
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => updateProgress.mutate()}
              disabled={updateProgress.isPending}
            >
              Save
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setIsEditing(true)} className="w-full">
          Update Progress
        </Button>
      )}
    </Card>
  );
}
