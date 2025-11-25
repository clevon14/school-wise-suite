// Grade calculation utility with configurable grade bands

export interface GradeBand {
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  description: string;
  color: string;
}

export const defaultGradeBands: GradeBand[] = [
  { grade: "A+", minPercentage: 90, maxPercentage: 100, description: "Outstanding", color: "text-success" },
  { grade: "A", minPercentage: 80, maxPercentage: 89, description: "Excellent", color: "text-success" },
  { grade: "B+", minPercentage: 70, maxPercentage: 79, description: "Very Good", color: "text-info" },
  { grade: "B", minPercentage: 60, maxPercentage: 69, description: "Good", color: "text-info" },
  { grade: "C+", minPercentage: 50, maxPercentage: 59, description: "Average", color: "text-warning" },
  { grade: "C", minPercentage: 40, maxPercentage: 49, description: "Below Average", color: "text-warning" },
  { grade: "D", minPercentage: 33, maxPercentage: 39, description: "Pass", color: "text-destructive" },
  { grade: "F", minPercentage: 0, maxPercentage: 32, description: "Fail", color: "text-destructive" },
];

export function calculateGrade(
  marksObtained: number,
  maxMarks: number,
  gradeBands: GradeBand[] = defaultGradeBands
): GradeBand {
  const percentage = (marksObtained / maxMarks) * 100;
  
  const grade = gradeBands.find(
    (band) => percentage >= band.minPercentage && percentage <= band.maxPercentage
  );
  
  return grade || gradeBands[gradeBands.length - 1]; // Default to lowest grade
}

export function calculatePercentage(marksObtained: number, maxMarks: number): number {
  return Math.round((marksObtained / maxMarks) * 100 * 100) / 100;
}

export function calculateTotalMarks(marks: { marks_obtained: number | null; is_absent: boolean | null }[]): number {
  return marks.reduce((total, mark) => {
    if (mark.is_absent) return total;
    return total + (mark.marks_obtained || 0);
  }, 0);
}

export function calculateMaxMarks(subjects: { max_marks: number }[]): number {
  return subjects.reduce((total, subject) => total + subject.max_marks, 0);
}
