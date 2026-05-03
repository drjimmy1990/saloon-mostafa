import { Award, Truck, CalendarCheck, Gem } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";

const features = [
  {
    icon: Award,
    title: "خبرة 10+ سنوات",
    description: "فريق محترف بخبرة واسعة في مجال التجميل والعناية",
    gradient: "from-terracotta/15 to-terracotta/5",
    iconColor: "text-terracotta",
    iconBg: "bg-terracotta/10",
  },
  {
    icon: Gem,
    title: "منتجات عالمية",
    description: "نستخدم أفضل الماركات العالمية لنتائج مبهرة",
    gradient: "from-sage/15 to-sage/5",
    iconColor: "text-sage",
    iconBg: "bg-sage/10",
  },
  {
    icon: CalendarCheck,
    title: "حجز سهل",
    description: "احجزي موعدك أونلاين بسهولة وبدون انتظار",
    gradient: "from-sand/15 to-sand/5",
    iconColor: "text-sand",
    iconBg: "bg-sand/10",
  },
  {
    icon: Truck,
    title: "خدمة منزلية",
    description: "نوفر خدمات التجميل في منزلك لراحتك",
    gradient: "from-terracotta/15 to-terracotta/5",
    iconColor: "text-terracotta",
    iconBg: "bg-terracotta/10",
  },
];

export function WhyUs() {
  return (
    <section className="py-16 md:py-24 gradient-mesh relative overflow-hidden">
      <div className="container mx-auto max-w-7xl px-4 relative z-10">
        <SectionHeader
          title="لماذا جاردينيا؟"
          subtitle="نحن هنا لنقدم لك تجربة تجميل فريدة ومميزة"
          gradient
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group text-center p-6 md:p-8 rounded-2xl glass border border-white/40 hover:border-terracotta/20 transition-all duration-500 card-hover animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div
                  className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${feature.iconBg} flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:shadow-lg transition-all duration-500`}
                >
                  <Icon className={`w-6 h-6 md:w-7 md:h-7 ${feature.iconColor}`} />
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
