import { getSupabaseClient } from "@/lib/supabase";
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
  const supabase = getSupabaseClient();

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
  if (!offer) return price;
  if (offer.discountType === "percentage") {
    return price * (1 - offer.discountValue / 100);
  }
  return Math.max(0, price - offer.discountValue);
}

export default async function ProductsPage() {
  const { products, offers } = await getProducts();

  return (
    <div className="min-h-screen bg-cream py-12 md:py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <SectionHeader
          title="منتجاتنا"
          subtitle="منتجات تجميل وعناية عالية الجودة — توصيل في الأردن"
        />

        {/* Products grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, i) => {
            const offer = offers.find((o) => o.product_id === product.id);
            const discountedPrice = calculateDiscountedPrice(product.price, offer);
            const inStock = product.stock !== null && product.stock > 0;

            return (
              <div
                key={product.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-border/50 card-hover animate-fade-in-up"
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
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
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
                        <Badge className="bg-red-500 text-white border-none shadow-lg font-bold text-xs">
                          {offer.discountType === "percentage"
                            ? `${offer.discountValue}%`
                            : `${offer.discountValue} د.أ`}
                        </Badge>
                      </div>
                    )}

                    {/* Stock badge */}
                    {!inStock && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Badge variant="destructive" className="text-sm font-bold">
                          غير متوفر
                        </Badge>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="p-4">
                  <Link href={`/products/${product.id}`}>
                    <h3 className="font-bold text-sm text-dark mb-1 line-clamp-2 group-hover:text-terracotta transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Stock indicator */}
                  {inStock && (
                    <p className="text-[10px] text-sage mb-2">
                      متوفر ({product.stock} قطعة)
                    </p>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-lg font-black text-terracotta tabular-nums">
                      {discountedPrice.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">د.أ</span>
                    {offer && (
                      <span className="text-xs text-muted-foreground line-through tabular-nums">
                        {product.price.toFixed(2)}
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
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-xl">سيتم إضافة المنتجات قريباً ✨</p>
          </div>
        )}
      </div>
    </div>
  );
}
