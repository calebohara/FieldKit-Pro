export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  role: "free" | "pro" | "admin";
  created_at: string;
  updated_at: string;
}

export interface ToolUsage {
  id: string;
  user_id: string;
  tool_name: string;
  created_at: string;
}

export interface ColumnConfig<T> {
  key: keyof T;
  label: string;
  searchable?: boolean;
}
