import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, children, className = "" }: SectionHeaderProps) {
  return (
    <div className={`text-center mb-10 ${className}`}>
      <h2
        className="text-3xl md:text-4xl font-bold text-dark mb-3"
        style={{ fontFamily: "'Tajawal', sans-serif" }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
      {children}
      {/* Decorative line */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <div className="w-8 h-[2px] bg-terracotta/30 rounded-full" />
        <div className="w-2 h-2 rounded-full bg-terracotta" />
        <div className="w-8 h-[2px] bg-terracotta/30 rounded-full" />
      </div>
    </div>
  );
}
