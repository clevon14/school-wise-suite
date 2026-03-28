import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, School, Award } from "lucide-react";

const curriculumData = [
  {
    stage: "Foundational Stage",
    classes: "Class 1 – 3",
    icon: BookOpen,
    color: "bg-primary/10 text-primary",
    subjects: [
      { category: "Languages", items: ["First Language (Mother Tongue)", "Second Language (English/Kannada)"] },
      { category: "Mathematics", items: ["Basic arithmetic and number sense"] },
      { category: "EVS", items: ["Integrated Science & Social Studies"] },
    ],
  },
  {
    stage: "Preparatory Stage",
    classes: "Class 4 – 5",
    icon: School,
    color: "bg-accent/10 text-accent-foreground",
    subjects: [
      { category: "Languages", items: ["First Language", "Second Language"] },
      { category: "Mathematics", items: ["Operations, fractions, measurements"] },
      { category: "EVS", items: ["Detailed study of surroundings & nature"] },
      { category: "Others", items: ["Physical Education"] },
    ],
  },
  {
    stage: "Middle / Higher Primary",
    classes: "Class 6 – 8",
    icon: GraduationCap,
    color: "bg-secondary/50 text-secondary-foreground",
    subjects: [
      { category: "Languages", items: ["First Language (Kannada/English/Urdu)", "Second Language (English/Kannada)", "Third Language (Hindi/Sanskrit)"] },
      { category: "Core Subjects", items: ["Mathematics – Algebra, Geometry, Data Handling", "Science – Physics, Chemistry, Biology basics", "Social Science – History, Civics, Geography"] },
      { category: "Others", items: ["Physical Education", "Art Education", "Value Education"] },
    ],
  },
  {
    stage: "Secondary (SSLC)",
    classes: "Class 9 – 10",
    icon: Award,
    color: "bg-destructive/10 text-destructive",
    subjects: [
      { category: "Languages (3 papers)", items: ["First Language – 100 marks", "Second Language – 80 + 20 internal", "Third Language – 80 + 20 internal"] },
      { category: "Core Subjects (3 papers)", items: ["Mathematics – AP, Triangles, Trigonometry", "Science – Physics, Chemistry, Biology", "Social Science – History, Pol. Science, Geography, Economics"] },
      { category: "Vocational (NSQF)", items: ["Information Technology", "Retail", "Automobile"] },
    ],
  },
];

export function KSEABCurriculum() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          KSEAB Curriculum Structure (Karnataka)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Subject structure for Classes 1–10 under the Karnataka School Examination and Assessment Board
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {curriculumData.map((stage) => {
            const Icon = stage.icon;
            return (
              <Card key={stage.stage} className="border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className={`p-1.5 rounded-md ${stage.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {stage.stage}
                    </CardTitle>
                    <Badge variant="outline">{stage.classes}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {stage.subjects.map((group) => (
                    <div key={group.category}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        {group.category}
                      </p>
                      <ul className="space-y-0.5">
                        {group.items.map((item) => (
                          <li key={item} className="text-sm flex items-start gap-1.5">
                            <span className="text-primary mt-1.5 shrink-0">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
