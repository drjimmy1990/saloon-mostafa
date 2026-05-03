import { getServiceRoleClient } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/catalog/add-to-cart-button";

export const metadata: Metadata = {
  title: "المنتجات | صالون جاردينيا",
  description: "تسوّقي منتجات التجميل والعناية من صالون جاردينيا — شحن وتوصيل في الأردن.",
};

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  isAvailable: boolean;
  stock: number | null;
}

interface Offer {
  discountType: string;
  discountValue: number;
  isActive: boolean;
  product_id: string;
}

async function getProducts() {
  const supabase = getServiceRoleClient();

  const [{ data: products }, { data: offers }] = await Promise.all([
    supabase
      .from("Product")
      .select("*")
      .eq("isAvailable", true)
      .eq("type", "product")
      .order("sortOrder", { ascending: true }),
    supabase
      .from("Offer")
      .select("product_id, discountType, discountValue, isActive")
      .eq("isActive", true),
  ]);

  return {
    products: (products || []) as Product[],
    offers: (offers || []) as Offer[],
  };
}

function calculateDiscountedPrice(price: number, offer: Offer | undefined) {
  const safePrice = Number(price) || 0;
  if (!offer) return safePrice;
  if (offer.discountType === "percentage") {
    return safePrice * (1 - Number(offer.discountValue) / 100);
  }
  return Math.max(0, safePrice - Number(offer.discountValue));
}

export default async function ProductsPage() {
  const { products, offers } = await getProducts();

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero banner */}
      <div className="relative bg-gradient-to-bl from-terracotta-light/40 via-cream to-sand-light/30 py-16 md:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-[15%] w-64 h-64 rounded-full bg-terracotta/5 blur-3xl" />
          <div className="absolute bottom-10 right-[10%] w-80 h-80 rounded-full bg-sand/5 blur-3xl" />
        </div>
        <div className="container mx-auto max-w-7xl px-4 relative z-10">
          <SectionHeader
            title="منتجاتنا"
            subtitle="منتجات تجميل وعناية عالية الجودة — توصيل في الأردن"
            gradient
          />
        </div>
      </div>

      {/* Products grid */}
      <div className="container mx-auto max-w-7xl px-4 py-10 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, i) => {
            const offer = offers.find((o) => o.product_id === product.id);
            const discountedPrice = calculateDiscountedPrice(product.price, offer);
            const inStock = product.stock !== null && product.stock > 0;

            return (
              <div
                key={product.id}
                className="group card-premium animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Image */}
                <Link href={`/products/${product.id}`}>
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-sand-light">
                        <span className="text-4xl">🧴</span>
                      </div>
                    )}

                    {/* Offer badge */}
                    {offer && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-red-500 text-white border-none shadow-lg font-bold text-xs px-2.5 py-1">
                          {offer.discountType === "percentage"
                            ? `${offer.discountValue}%`
                            : `${offer.discountValue} د.أ`}
                        </Badge>
                      </div>
                    )}

                    {/* Stock status */}
                    {!inStock && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
                        <Badge variant="destructive" className="text-sm font-bold px-4 py-1.5">
                          غير متوفر
                        </Badge>
                      </div>
                    )}

                    {/* Quick view overlay */}
                    {inStock && product.description && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-3">
                        <p className="text-white text-xs line-clamp-2 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-500">
                          {product.description}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="p-4">
                  <Link href={`/products/${product.id}`}>
                    <h3 className="font-bold text-sm text-dark mb-1.5 line-clamp-2 group-hover:text-terracotta transition-colors leading-snug">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Stock indicator */}
                  {inStock && (
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" />
                      <p className="text-[10px] text-emerald-600 font-medium">
                        متوفر ({product.stock} قطعة)
                      </p>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-lg font-black text-terracotta tabular-nums">
                      {Number(discountedPrice ?? 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">د.أ</span>
                    {offer && (
                      <span className="text-xs text-muted-foreground line-through tabular-nums">
                        {Number(product.price ?? 0).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Add to cart */}
                  <AddToCartButton
                    product={{
                      productId: product.id,
                      name: product.name,
                      price: discountedPrice,
                      image: product.images?.[0] || "",
                      stock: product.stock,
                    }}
                    disabled={!inStock}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {products.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🛍️</div>
            <p className="text-xl text-muted-foreground font-medium">سيتم إضافة المنتجات قريباً</p>
            <p className="text-sm text-muted-foreground/60 mt-2">ترقبي مجموعتنا من أفضل منتجات التجميل</p>
          </div>
        )}
      </div>
    </div>
  );
}
