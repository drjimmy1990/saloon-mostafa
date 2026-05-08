import { getSiteSettings } from "@/lib/settings";
import { getServiceRoleClient } from "@/lib/supabase";
import { Metadata } from "next";
import { SectionHeader } from "@/components/shared/section-header";
import { Phone, MapPin, MessageCircle, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "تواصلي معنا | صالون نون",
  description: "تواصلي مع صالون نون — العنوان، الهاتف، واتساب. الرياض، السعودية.",
};

async function getContactInfo() {
  const supabase = getServiceRoleClient();
  const [{ data: page }, settings] = await Promise.all([
    supabase.from("CmsPage").select("title, content").eq("slug", "contact").single(),
    getSiteSettings(),
  ]);
  return { page, settings };
}

export default async function ContactPage() {
  const { page, settings } = await getContactInfo();
  const phoneNumber = settings.salon_phone || "962786753791";
  const whatsappNumber = settings.whatsapp_number || phoneNumber;
  const salonAddress = settings.salon_address || "الرياض، السعودية";
  const workingWeekdays = settings.working_hours_weekdays || "السبت - الخميس: 10:00 ص - 8:00 م";
  const workingFriday = settings.working_hours_friday || "الجمعة: مغلق";
  const mapsUrl = settings.google_maps_url || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d217257.96330223998!2d35.72862505!3d31.9539494!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151b5fb85d7981b1%3A0x631c30c0f8dc65e8!2sAmman%2C%20Jordan!5e0!3m2!1sar!2sus!4v1";

  return (
    <div className="min-h-screen bg-cream py-12 md:py-20">
      <div className="container mx-auto max-w-5xl px-4">
        <SectionHeader title={page?.title || "تواصلي معنا"} subtitle="نسعد بخدمتك — تواصلي معنا في أي وقت" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact cards */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/50 card-hover">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-terracotta/10 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-terracotta" />
                </div>
                <div>
                  <h3 className="font-bold text-dark mb-1">الهاتف</h3>
                  <a
                    href={`tel:+${phoneNumber}`}
                    className="text-muted-foreground hover:text-terracotta transition-colors"
                    dir="ltr"
                  >
                    +{phoneNumber}
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/50 card-hover">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-dark mb-1">واتساب</h3>
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-green-600 transition-colors"
                  >
                    تواصلي عبر الواتساب
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/50 card-hover">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-sage/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-sage" />
                </div>
                <div>
                  <h3 className="font-bold text-dark mb-1">العنوان</h3>
                  <p className="text-muted-foreground">{salonAddress}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/50 card-hover">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-sand/10 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-sand" />
                </div>
                <div>
                  <h3 className="font-bold text-dark mb-1">أوقات العمل</h3>
                  <p className="text-muted-foreground text-sm">{workingWeekdays}</p>
                  <p className="text-muted-foreground text-sm">{workingFriday}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border/50 min-h-[400px]">
            <iframe
              src={mapsUrl}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "400px" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="موقع صالون نون"
            />
          </div>
        </div>

        {/* CMS content */}
        {page?.content && (
          <div
            className="mt-8 prose prose-lg max-w-none bg-white rounded-2xl p-8 shadow-sm border border-border/50"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        )}
      </div>
    </div>
  );
}
