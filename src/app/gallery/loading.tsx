export default function GalleryLoading() {
  return (
    <div className="min-h-screen bg-cream py-12 md:py-20">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header skeleton */}
        <div className="text-center mb-12 md:mb-16">
          <div className="h-10 w-48 bg-muted/60 rounded-xl mx-auto mb-4 animate-pulse" />
          <div className="h-5 w-64 bg-muted/40 rounded-lg mx-auto animate-pulse" />
          <div className="flex items-center justify-center gap-2 mt-5">
            <div className="w-10 h-[2px] rounded-full bg-terracotta/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-terracotta/30" />
            <div className="w-10 h-[2px] rounded-full bg-terracotta/20" />
          </div>
        </div>
        {/* Category tabs skeleton */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 w-16 bg-muted/50 rounded-full animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
        {/* Masonry skeleton */}
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-muted/30 animate-pulse break-inside-avoid" style={{ aspectRatio: i % 2 === 0 ? "3/4" : "4/5", animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
