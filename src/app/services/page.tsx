import { getServiceRoleClient } from "@/lib/supabase";
import { Metadata } from "next";
import { ServicesClient } from "./services-client";

export const revalidate = 300; // ISR: revalidate every 5 minutes

export const metadata: Metadata = {
  title: "الخدمات | صالون نون",
  description: "تصفحي جميع خدمات التجميل المتاحة في صالون نون — تصفيف الشعر، المكياج، الأظافر، والعناية بالبشرة.",
};

async function getServiceData() {
  const supabase = getServiceRoleClient();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("Category").select("id, label, color, image").eq("type", "service").order("createdAt", { ascending: true }),
    supabase
      .from("Product")
      .select("id, category")
      .eq("isAvailable", true)
      .eq("type", "service"),
  ]);

  // Count services per category
  const serviceCounts: Record<string, number> = {};
  for (const p of products || []) {
    if (p.category) {
      serviceCounts[p.category] = (serviceCounts[p.category] || 0) + 1;
    }
  }

  return {
    categories: (categories || []),
    serviceCounts,
  };
}

export default async function ServicesPage() {
  const { categories, serviceCounts } = await getServiceData();

  return <ServicesClient categories={categories} serviceCounts={serviceCounts} />;
}
