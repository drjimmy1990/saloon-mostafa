"use client";

import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

export function WhatsAppFloat() {
  const [whatsappNumber, setWhatsappNumber] = useState("962786753791");
  const [show, setShow] = useState(false);
  const message = encodeURIComponent("مرحباً، أريد الاستفسار عن خدمات صالون نون 🌸");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.whatsapp_number) setWhatsappNumber(data.whatsapp_number);
      })
      .catch(() => {});

    // Delay showing the FAB for a smoother UX
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <a
      href={`https://wa.me/${whatsappNumber}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed z-50 group transition-all duration-500 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } bottom-20 left-4 md:bottom-6 md:left-6`}
      aria-label="تواصل عبر الواتساب"
    >
      <div className="relative">
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-full animate-pulse-glow" />

        {/* Button */}
        <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#25D366] shadow-xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl">
          <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>

        {/* Tooltip — desktop only */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-dark text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg hidden md:block">
          تواصلي معنا عبر الواتساب
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-dark rotate-45" />
        </div>
      </div>
    </a>
  );
}
