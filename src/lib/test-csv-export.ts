import { format } from "date-fns";

export function exportTestsToCSV(tests: any[]) {
  const headers = [
    "Test Name",
    "Class",
    "Subject",
    "Date",
    "Max Marks",
    "Total Students",
    "Present",
    "Absent",
    "Average Score",
    "Highest",
    "Lowest",
    "Median",
    "Pass Count",
    "Pass %",
  ];

  const rows = tests.map((test) => [
    test.test_name,
    `${test.classes?.name || ""} ${test.classes?.section || ""}`.trim(),
    test.subjects?.name || "",
    format(new Date(test.test_date), "yyyy-MM-dd"),
    test.max_marks,
    test.total_students,
    test.present_count,
    test.absent_count,
    test.avg_score || "",
    test.highest_score || "",
    test.lowest_score || "",
    test.median_score || "",
    test.pass_count || "",
    test.pass_percentage || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `tests_${format(new Date(), "yyyy-MM-dd")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportTestResultsToCSV(test: any, results: any[]) {
  const headers = [
    "Student Name",
    "Admission No",
    "Class",
    "Test Name",
    "Subject",
    "Date",
    "Max Marks",
    "Marks Obtained",
    "Percent",
    "Grade",
    "Remark",
    "Attendance",
  ];

  const rows = results.map((result) => {
    const student = result.students;
    const percentage = result.marks_obtained && !result.is_absent
      ? ((result.marks_obtained / test.max_marks) * 100).toFixed(2)
      : "";
    
    let grade = "";
    if (result.marks_obtained && !result.is_absent) {
      const percent = (result.marks_obtained / test.max_marks) * 100;
      if (percent >= 90) grade = "A+";
      else if (percent >= 80) grade = "A";
      else if (percent >= 70) grade = "B+";
      else if (percent >= 60) grade = "B";
      else if (percent >= 50) grade = "C+";
      else if (percent >= 40) grade = "C";
      else if (percent >= 33) grade = "D";
      else grade = "F";
    }

    const remark = result.is_absent
      ? "Absent"
      : result.marks_obtained >= test.pass_marks
      ? "Pass"
      : "Fail";

    return [
      `${student?.first_name || ""} ${student?.last_name || ""}`.trim(),
      student?.admission_number || "",
      `${test.classes?.name || ""} ${test.classes?.section || ""}`.trim(),
      test.name,
      test.subjects?.name || "",
      format(new Date(test.test_date), "yyyy-MM-dd"),
      test.max_marks,
      result.is_absent ? "Absent" : result.marks_obtained || "Not entered",
      percentage,
      grade,
      remark,
      result.is_absent ? "Absent" : "Present",
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${test.name.replace(/\s+/g, "_")}_results_${format(new Date(), "yyyy-MM-dd")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
