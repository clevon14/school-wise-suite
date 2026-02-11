import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StudentTestHistory } from "@/components/tests/StudentTestHistory";

interface StudentTestResultsDialogProps {
  studentId: string;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentTestResultsDialog({ studentId, studentName, open, onOpenChange }: StudentTestResultsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Test Results - {studentName}</DialogTitle>
        </DialogHeader>
        <StudentTestHistory studentId={studentId} />
      </DialogContent>
    </Dialog>
  );
}
