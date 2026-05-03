import { getServiceRoleClient } from "@/lib/supabase";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/catalog/add-to-cart-button";

interface Props { params: Promise<{ id: string }> }

async function getProduct(id: string) {
  const supabase = getServiceRoleClient();
  const [{ data: product }, { data: offers }] = await Promise.all([
    supabase.from("Product").select("*").eq("id", id).single(),
    supabase.from("Offer").select("*").eq("product_id", id).eq("isActive", true),
  ]);
  return { product, offer: offers?.[0] };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const { product, offer } = await getProduct(id);
  if (!product) notFound();

  const discountedPrice = offer
    ? offer.discountType === "percentage" ? Number(product.price ?? 0) * (1 - Number(offer.discountValue) / 100) : Math.max(0, Number(product.price ?? 0) - Number(offer.discountValue))
    : Number(product.price ?? 0);
  const inStock = product.stock !== null && product.stock > 0;

  return (
    <div className="min-h-screen bg-cream py-12 md:py-20">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
              {product.images?.[0] ? (
                <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><span className="text-6xl">🧴</span></div>
              )}
              {offer && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-500 text-white border-none shadow-lg text-sm font-bold">
                    {offer.discountType === "percentage" ? `${offer.discountValue}%` : `${offer.discountValue} د.أ`}
                  </Badge>
                </div>
              )}
              {!inStock && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Badge variant="destructive" className="text-lg font-bold">غير متوفر</Badge>
                </div>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1, 5).map((img: string, i: number) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                    <Image src={img} alt="" fill className="object-cover" sizes="100px" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-dark mb-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>{product.name}</h1>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-terracotta tabular-nums">{discountedPrice.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground">د.أ</span>
                {offer && <span className="text-lg text-muted-foreground line-through tabular-nums">{Number(product.price ?? 0).toFixed(2)}</span>}
              </div>
            </div>
            {inStock && <p className="text-sm text-sage">✓ متوفر ({product.stock} قطعة)</p>}
            {product.description && <p className="text-muted-foreground leading-relaxed">{product.description}</p>}
            <div className="max-w-xs">
              <AddToCartButton
                product={{ productId: product.id, name: product.name, price: discountedPrice, image: product.images?.[0] || "", stock: product.stock }}
                disabled={!inStock}
                className="py-4 text-base"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
