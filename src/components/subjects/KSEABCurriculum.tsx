import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookOpen, GraduationCap, School, Award, Download, FileText, Languages, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    learningObjectives: [
      "Develop basic literacy and numeracy through play-based and activity-oriented methods",
      "Build observation skills and curiosity about the natural and social environment",
      "Encourage creative expression through art, craft, music and storytelling",
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
    learningObjectives: [
      "Strengthen reading comprehension and written expression in two languages",
      "Develop problem-solving ability with arithmetic operations and measurement",
      "Introduce systematic observation of surroundings, nature and community",
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
    learningObjectives: [
      "Engage with abstract thinking through algebra, geometry, and data handling",
      "Develop scientific temper: observation, intuition, hypothesizing and experimentation",
      "Understand India's constitutional values, history and geographical diversity",
      "Acquire proficiency in the three-language formula",
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
    learningObjectives: [
      "Think and reason mathematically; visualize and work with abstractions",
      "Relate science to life and understand technological applications",
      "Develop critical perspectives on history, democracy, and economic systems",
      "Prepare for board examinations with structured assessment patterns",
    ],
  },
];

const languagePolicy = [
  {
    combination: "A",
    firstLanguage: "Kannada",
    secondLanguage: "English",
    thirdLanguage: "Hindi / Sanskrit / Urdu / Tamil / Telugu / Marathi / Any modern Indian language",
  },
  {
    combination: "B",
    firstLanguage: "English",
    secondLanguage: "Kannada",
    thirdLanguage: "Hindi / Sanskrit / Urdu / Tamil / Telugu / Marathi / Any modern Indian language",
  },
  {
    combination: "C",
    firstLanguage: "Urdu / Tamil / Telugu / Marathi / Any minority language",
    secondLanguage: "English",
    thirdLanguage: "Kannada (compulsory as third language)",
  },
];

const guidelines = [
  {
    title: "Child-Centred Pedagogy",
    description: "Shift from rote memorization to constructive, discovery-based learning. The child constructs knowledge through interaction with the environment.",
  },
  {
    title: "Continuous & Comprehensive Evaluation (CCE)",
    description: "Replace single-exam assessment with ongoing formative and summative evaluation covering scholastic and co-scholastic domains.",
  },
  {
    title: "Multilingualism as a Resource",
    description: "Use the child's home language as a bridge to learning. The three-language formula ensures linguistic diversity while promoting Kannada and English proficiency.",
  },
  {
    title: "Connecting Knowledge to Life",
    description: "Curriculum must relate to the child's lived experience. Local environment, culture, and occupations should be integrated into teaching materials.",
  },
  {
    title: "Inclusive Education",
    description: "Address diverse needs including children with disabilities, first-generation learners, and marginalized communities. Ensure no child is excluded from quality education.",
  },
  {
    title: "Reducing Curricular Burden",
    description: "Follow the 'Learning Without Burden' principle. Focus on understanding over memorization, quality over quantity of content.",
  },
];

export function KSEABCurriculum() {
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
              Subject structure for Classes 1–10 under the Karnataka School Examination and Assessment Board — based on KCF 2007
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/documents/KCF2007-EngVer.pdf" target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-1" />
              KCF 2007 PDF
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="subjects" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="subjects" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Subject Structure
            </TabsTrigger>
            <TabsTrigger value="language" className="gap-1.5">
              <Languages className="h-3.5 w-3.5" />
              Language Policy
            </TabsTrigger>
            <TabsTrigger value="guidelines" className="gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" />
              Guidelines
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subjects">
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
                      <div className="pt-2 border-t">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Learning Objectives
                        </p>
                        <ul className="space-y-0.5">
                          {stage.learningObjectives.map((obj) => (
                            <li key={obj} className="text-sm flex items-start gap-1.5 text-muted-foreground">
                              <span className="text-accent-foreground mt-1.5 shrink-0">›</span>
                              {obj}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="language">
            <Card className="border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Three-Language Formula (KCF 2007)</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Official language combinations for Classes 6–10 as prescribed by the Karnataka Curriculum Framework
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Combination</TableHead>
                      <TableHead>First Language</TableHead>
                      <TableHead>Second Language</TableHead>
                      <TableHead>Third Language</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {languagePolicy.map((row) => (
                      <TableRow key={row.combination}>
                        <TableCell>
                          <Badge variant="secondary">{row.combination}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{row.firstLanguage}</TableCell>
                        <TableCell>{row.secondLanguage}</TableCell>
                        <TableCell className="text-sm">{row.thirdLanguage}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 p-3 rounded-md bg-muted/50 text-sm text-muted-foreground space-y-1">
                  <p>• First Language is studied from Class 1 onward; Second Language from Class 3 or 4; Third Language from Class 6.</p>
                  <p>• Kannada is compulsory either as First, Second, or Third Language for all students in Karnataka.</p>
                  <p>• The First Language carries 100 marks at SSLC level; Second and Third Languages carry 80 + 20 (internal) marks each.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guidelines">
            <div className="grid gap-4 md:grid-cols-2">
              {guidelines.map((g) => (
                <Card key={g.title} className="border">
                  <CardContent className="pt-5">
                    <h4 className="font-semibold text-sm mb-1">{g.title}</h4>
                    <p className="text-sm text-muted-foreground">{g.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4 text-xs text-muted-foreground text-center">
              Source: Karnataka Curriculum Framework 2007 (KCF 2007) —{" "}
              <a href="/documents/KCF2007-EngVer.pdf" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                Download full document
              </a>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
