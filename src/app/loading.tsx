export default function Loading() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-cream">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-[3px] border-terracotta/15" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-[3px] border-transparent border-t-terracotta animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          جاري التحميل...
        </p>
      </div>
    </div>
  );
}
