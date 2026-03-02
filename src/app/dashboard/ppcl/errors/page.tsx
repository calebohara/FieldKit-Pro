"use client";

import SearchableTable from "@/components/tools/SearchableTable";
import { ppclErrors } from "@/lib/data/ppcl-errors";

const columns = [
  { key: "error" as const, label: "Error", searchable: true },
  { key: "symptoms" as const, label: "Symptoms", searchable: true },
  { key: "rootCause" as const, label: "Root Cause", searchable: true },
  { key: "fix" as const, label: "Fix", searchable: true },
];

export default function PPCLErrorsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">PPCL Common Errors</h1>
      <SearchableTable
        data={ppclErrors}
        columns={columns}
        categoryKey="category"
        categoryLabel="Categories"
        searchPlaceholder="Search errors, symptoms, or fixes..."
        getItemId={(row) => `ppcl-error-${row.error}`}
        mobileSummaryKeys={["error", "symptoms"]}
      />
    </div>
  );
}
