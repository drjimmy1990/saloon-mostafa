import { getServiceRoleClient } from "@/lib/supabase";
import { Metadata } from "next";
import { ServicesClient } from "./services-client";

export const metadata: Metadata = {
  title: "الخدمات | صالون نون",
  description: "تصفحي جميع خدمات التجميل المتاحة في صالون نون — تصفيف الشعر، المكياج، الأظافر، والعناية بالبشرة.",
};

async function getServices() {
  const supabase = getServiceRoleClient();

  const [{ data: products }, { data: offers }, { data: categories }] = await Promise.all([
    supabase
      .from("Product")
      .select("*")
      .eq("isAvailable", true)
      .eq("type", "service")
      .order("sortOrder", { ascending: true }),
    supabase
      .from("Offer")
      .select("product_id, discountType, discountValue, isActive")
      .eq("isActive", true),
    supabase.from("Category").select("id, label, color").eq("type", "service").order("createdAt", { ascending: true }),
  ]);

  return {
    services: (products || []),
    offers: (offers || []),
    categories: (categories || []),
  };
}

export default async function ServicesPage() {
  const { services, offers, categories } = await getServices();

  return <ServicesClient services={services} offers={offers} categories={categories} />;
}
