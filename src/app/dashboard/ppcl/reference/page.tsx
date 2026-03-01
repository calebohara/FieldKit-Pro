"use client";

import SearchableTable from "@/components/tools/SearchableTable";
import { ppclCommands } from "@/lib/data/ppcl-commands";

const columns = [
  { key: "command" as const, label: "Command", searchable: true },
  { key: "syntax" as const, label: "Syntax", searchable: true },
  { key: "description" as const, label: "Description", searchable: true },
  { key: "example" as const, label: "Example", searchable: true },
];

export default function PPCLReferencePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">PPCL Command Reference</h1>
      <SearchableTable
        data={ppclCommands}
        columns={columns}
        categoryKey="category"
        categoryLabel="Categories"
        searchPlaceholder="Search commands, syntax, or descriptions..."
      />
    </div>
  );
}
