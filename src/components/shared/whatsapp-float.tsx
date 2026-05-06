"use client";

import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

export function WhatsAppFloat() {
  const [whatsappNumber, setWhatsappNumber] = useState("962786753791");
  const message = encodeURIComponent("مرحباً، أريد الاستفسار عن خدمات صالون جاردينيا 🌸");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.whatsapp_number) setWhatsappNumber(data.whatsapp_number);
      })
      .catch(() => {});
  }, []);

  return (
    <a
      href={`https://wa.me/${whatsappNumber}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 group hidden md:block"
      aria-label="تواصل عبر الواتساب"
    >
      <div className="relative">
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-full animate-pulse-glow" />

        {/* Button */}
        <div className="relative w-14 h-14 rounded-full bg-[#25D366] shadow-xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-dark text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          تواصلي معنا عبر الواتساب
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-dark rotate-45" />
        </div>
      </div>
    </a>
  );
}
