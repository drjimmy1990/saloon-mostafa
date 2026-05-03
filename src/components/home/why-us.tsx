import { Award, Truck, CalendarCheck, Gem } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";

const features = [
  {
    icon: Award,
    title: "خبرة 10+ سنوات",
    description: "فريق محترف بخبرة واسعة في مجال التجميل والعناية",
    color: "bg-terracotta/10 text-terracotta",
  },
  {
    icon: Gem,
    title: "منتجات عالمية",
    description: "نستخدم أفضل الماركات العالمية لنتائج مبهرة",
    color: "bg-sage/10 text-sage",
  },
  {
    icon: CalendarCheck,
    title: "حجز سهل",
    description: "احجزي موعدك أونلاين بسهولة وبدون انتظار",
    color: "bg-sand/10 text-sand",
  },
  {
    icon: Truck,
    title: "خدمة منزلية",
    description: "نوفر خدمات التجميل في منزلك لراحتك",
    color: "bg-terracotta/10 text-terracotta",
  },
];

export function WhyUs() {
  return (
    <section className="py-16 md:py-24 bg-cream">
      <div className="container mx-auto max-w-7xl px-4">
        <SectionHeader
          title="لماذا جاردينيا؟"
          subtitle="نحن هنا لنقدم لك تجربة تجميل فريدة ومميزة"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group text-center p-6 rounded-2xl bg-white shadow-sm border border-border/50 card-hover animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3
                  className="font-bold text-dark mb-2 text-sm md:text-base"
                  style={{ fontFamily: "'Tajawal', sans-serif" }}
                >
                  {feature.title}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
