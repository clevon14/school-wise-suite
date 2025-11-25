export const exportFeesCSV = async (data: any[]) => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Prepare CSV headers
  const headers = [
    "Student Name",
    "Admission No",
    "Class",
    "Village",
    "Fee Type",
    "Amount",
    "Month",
    "Status",
  ];

  // Prepare CSV rows
  const rows = data.map((item) => {
    const student = item.student;
    const feeCategory = item.fee_category;
    const dueDate = new Date(item.due_date);
    const month = dueDate.toLocaleString("default", { month: "long", year: "numeric" });

    return [
      student ? `${student.first_name} ${student.last_name}` : "N/A",
      student?.admission_number || "N/A",
      student?.class ? `${student.class.name}${student.class.section ? " - " + student.class.section : ""}` : "N/A",
      student?.village || "N/A",
      feeCategory?.name || "N/A",
      item.amount,
      month,
      item.status,
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell}"`).join(",")
    ),
  ].join("\n");

  // Create and download CSV file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `fee_records_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
