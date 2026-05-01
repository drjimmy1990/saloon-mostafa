import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — Export all clients as CSV
export async function GET() {
  const { data, error } = await supabase
    .from("Client")
    .select("name, phone, email, address, tags, notes, status, createdAt")
    .order("createdAt", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build CSV
  const headers = ["Name", "Phone", "Email", "Address", "Tags", "Notes", "Status", "Created At"];
  const rows = (data || []).map((client) => [
    escapeCsv(client.name || ""),
    escapeCsv(client.phone || ""),
    escapeCsv(client.email || ""),
    escapeCsv(client.address || ""),
    escapeCsv(Array.isArray(client.tags) ? client.tags.join(", ") : ""),
    escapeCsv(client.notes || ""),
    escapeCsv(client.status || "active"),
    escapeCsv(client.createdAt ? new Date(client.createdAt).toLocaleDateString() : ""),
  ]);

  // Add BOM for Excel Arabic support
  const BOM = "\uFEFF";
  const csv = BOM + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clients_export_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
