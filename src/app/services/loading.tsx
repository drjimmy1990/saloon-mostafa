export default function ServicesLoading() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Hero skeleton */}
      <div className="bg-gradient-to-bl from-terracotta-light/20 via-cream to-sand-light/15 py-16 md:py-24">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <div className="h-10 w-48 bg-muted/60 rounded-xl mx-auto mb-4 animate-pulse" />
          <div className="h-5 w-72 bg-muted/40 rounded-lg mx-auto animate-pulse" />
          <div className="flex items-center justify-center gap-2 mt-5">
            <div className="w-10 h-[2px] rounded-full bg-terracotta/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-terracotta/30" />
            <div className="w-10 h-[2px] rounded-full bg-terracotta/20" />
          </div>
        </div>
      </div>
      {/* Grid skeleton */}
      <div className="container mx-auto max-w-7xl px-4 py-10">
        {/* Category tabs skeleton */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 w-20 bg-muted/50 rounded-full animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-[1.25rem] bg-white border border-border/30 overflow-hidden animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="aspect-[4/3] bg-muted/40" />
              <div className="p-4 space-y-2.5">
                <div className="h-4 w-3/4 bg-muted/50 rounded" />
                <div className="h-3 w-1/2 bg-muted/30 rounded" />
                <div className="h-9 w-full bg-muted/30 rounded-lg mt-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
