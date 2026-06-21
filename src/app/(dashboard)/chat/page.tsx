"use client";

import { ChatSection } from "@/components/sections/chat-section";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ChatSection />
    </Suspense>
  );
}
