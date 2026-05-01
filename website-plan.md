# Gardenia Salon — Public E-Commerce Website Plan

> **Status:** Ready to implement after dashboard testing is complete.
> **Payment Gateway:** Paymob (Jordan)
> **Shared Backend:** Same Supabase project as the admin dashboard

---

## 1. Architecture Overview

```
gardenia-website/              ← New Next.js project (separate from dashboard)
├── app/
│   ├── layout.tsx             ← Root layout: Arabic font, RTL, metadata, cart provider
│   ├── page.tsx               ← Homepage: Hero + Featured Services + CTA
│   ├── services/
│   │   └── page.tsx           ← Browse all services with prices & offers
│   ├── services/[id]/
│   │   └── page.tsx           ← Single service detail page
│   ├── products/
│   │   └── page.tsx           ← Product catalog (purchasable items)
│   ├── products/[id]/
│   │   └── page.tsx           ← Single product detail page
│   ├── booking/
│   │   └── page.tsx           ← Online booking form
│   ├── gallery/
│   │   └── page.tsx           ← Work showcase (from Gallery table)
│   ├── cart/
│   │   └── page.tsx           ← Shopping cart
│   ├── checkout/
│   │   └── page.tsx           ← Checkout form + payment
│   ├── checkout/success/
│   │   └── page.tsx           ← Payment success confirmation
│   ├── checkout/failure/
│   │   └── page.tsx           ← Payment failed page
│   ├── about/
│   │   └── page.tsx           ← About Us (from CmsPage table)
│   ├── contact/
│   │   └── page.tsx           ← Contact info + Google Maps
│   ├── privacy/
│   │   └── page.tsx           ← Privacy Policy (from CmsPage)
│   ├── terms/
│   │   └── page.tsx           ← Terms & Conditions (from CmsPage)
│   └── api/
│       ├── payment/
│       │   ├── intent/route.ts    ← Create Paymob payment intention
│       │   └── webhook/route.ts   ← Paymob callback (verify HMAC, update order)
│       ├── booking/route.ts       ← Create booking from website
│       └── order/route.ts         ← Create order from checkout
├── components/
│   ├── layout/
│   │   ├── header.tsx         ← Navbar: logo, nav links, cart icon with badge
│   │   ├── footer.tsx         ← Footer: links, social, copyright, WhatsApp button
│   │   └── mobile-nav.tsx     ← Mobile hamburger menu
│   ├── home/
│   │   ├── hero-section.tsx   ← Full-width hero with CTA
│   │   ├── featured-services.tsx  ← Carousel of top services
│   │   ├── why-us.tsx         ← Trust badges / USPs
│   │   └── cta-banner.tsx     ← Book Now / WhatsApp CTA
│   ├── catalog/
│   │   ├── service-card.tsx   ← Service card with price, offer badge, book button
│   │   ├── product-card.tsx   ← Product card with price, stock, add-to-cart
│   │   ├── catalog-grid.tsx   ← Responsive grid with category filter
│   │   └── offer-badge.tsx    ← "20% OFF" badge component
│   ├── booking/
│   │   ├── booking-form.tsx   ← Multi-step booking form
│   │   ├── date-picker.tsx    ← Date selection with available slots
│   │   └── service-selector.tsx   ← Service picker with prices
│   ├── cart/
│   │   ├── cart-drawer.tsx    ← Slide-out cart sidebar
│   │   ├── cart-item.tsx      ← Single cart item row
│   │   └── cart-summary.tsx   ← Subtotal, delivery, total
│   ├── checkout/
│   │   ├── checkout-form.tsx  ← Customer info form
│   │   ├── payment-selector.tsx   ← Cash / Cliq / Card selector
│   │   └── order-summary.tsx  ← Final order review
│   └── shared/
│       ├── whatsapp-float.tsx ← Floating WhatsApp button
│       ├── section-header.tsx ← Reusable section title
│       └── loading-skeleton.tsx
├── lib/
│   ├── supabase.ts            ← Supabase client (same anon key)
│   ├── cart-store.ts          ← Zustand cart state (persisted to localStorage)
│   ├── paymob.ts              ← Paymob API helpers
│   └── utils.ts               ← Shared utilities
├── public/
│   ├── logo.png               ← Salon logo
│   └── og-image.jpg           ← Social share image
├── .env.local
├── package.json
├── tailwind.config.ts
└── next.config.ts
```

---

## 2. Database Tables Used (Already Created)

The website reads/writes to the **same Supabase** as the dashboard:

| Table | Website Usage |
|---|---|
| `Product` | Display services & products (read-only) |
| `Category` | Filter services/products by category |
| `Offer` | Show discount badges on services |
| `Staff` | Show available staff (optional for booking) |
| `StaffSchedule` | Check availability for booking |
| `Gallery` | Display work photos |
| `CmsPage` | Render About, Contact, Privacy, Terms pages |
| `Client` | Find/create client on checkout or booking |
| `Booking` | Create new bookings |
| `Order` | Create new product orders |
| `SystemSetting` | Read salon address, contact info |

**No new tables needed** — everything was created in `migration-v2.sql`.

---

## 3. Environment Variables

```env
# Same Supabase instance as the dashboard
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Paymob (Jordan)
PAYMOB_API_KEY=ZXl...
PAYMOB_INTEGRATION_ID=12345
PAYMOB_IFRAME_ID=67890
PAYMOB_HMAC_SECRET=abc123...

# Site
NEXT_PUBLIC_SITE_URL=https://gardenia-salon.com
NEXT_PUBLIC_WHATSAPP_NUMBER=962799999999
NEXT_PUBLIC_SALON_NAME=صالون جاردينيا
```

---

## 4. Page-by-Page Specification

### 4.1 Homepage (`/`)

**Sections (top to bottom):**

1. **Hero Banner**
   - Full-width background image of the salon
   - Arabic headline: "مرحباً بك في صالون جاردينيا"
   - Subtitle: "خدمات تجميل احترافية في الأردن"
   - Two CTAs: "احجزي الآن" (link to /booking) + "تسوّقي المنتجات" (link to /products)

2. **Featured Services Carousel**
   - Query: `SELECT * FROM Product WHERE isAvailable = true ORDER BY sortOrder LIMIT 8`
   - Each card: image, name, price, "Book" button
   - Show offer badge if an active `Offer` exists for the product

3. **Why Choose Us**
   - 3-4 trust badges: "خبرة 10+ سنوات", "منتجات عالمية", "حجز سهل", "خدمة منزلية"

4. **Gallery Preview**
   - Query: `SELECT * FROM Gallery ORDER BY sortOrder LIMIT 6`
   - Masonry/grid of latest work photos
   - "شاهدي المزيد" button → /gallery

5. **WhatsApp CTA Banner**
   - "تواصلي معنا عبر الواتساب" + floating WhatsApp link

### 4.2 Services Page (`/services`)

**Layout:**
- Category filter tabs at the top (from `Category` table)
- Grid of service cards (from `Product` table)
- Each card shows:
  - Image
  - Name
  - Price (with strikethrough if offer active)
  - Offer badge ("خصم 20%")
  - Location badges: "في الصالون" / "في المنزل" (from `availableAtHome` / `availableAtSalon`)
  - "احجزي" button → opens booking with this service pre-selected

**Data query:**
```sql
SELECT p.*, o."discountType", o."discountValue", o."isActive" as "hasOffer"
FROM "Product" p
LEFT JOIN "Offer" o ON o.product_id = p.id AND o."isActive" = true
WHERE p."isAvailable" = true
ORDER BY p."sortOrder" ASC
```

### 4.3 Service Detail Page (`/services/[id]`)

- Large image gallery (from `Product.images` JSONB)
- Full description
- Price with offer calculation
- Location options
- Related services (same category)
- "Book This Service" button

### 4.4 Products Page (`/products`)

- Same layout as services but for purchasable items (where `stock IS NOT NULL`)
- "Add to Cart" button instead of "Book"
- Stock indicator: "متوفر" / "غير متوفر"
- Category filter

### 4.5 Product Detail Page (`/products/[id]`)

- Large image gallery
- Full description
- Price with offer
- Stock count
- Quantity selector
- "أضف للسلة" (Add to Cart) button

### 4.6 Booking Page (`/booking`)

**Multi-step form:**

```
Step 1: Select Service(s)
  └─ Grid of services with checkboxes
  └─ Shows total price

Step 2: Select Date & Time
  └─ Calendar date picker
  └─ Available time slots (based on StaffSchedule)
  └─ Optional: select preferred staff

Step 3: Location
  └─ "في الصالون" or "في المنزل"
  └─ If home: address input field

Step 4: Your Info
  └─ Name (required)
  └─ Phone (required, pre-filled if returning)
  └─ Notes (optional)

Step 5: Confirmation
  └─ Summary of everything
  └─ "تأكيد الحجز" button
```

**On submit:**
1. Find or create `Client` by phone
2. Create `Booking` with:
   - `client_id`: matched client
   - `serviceSummary`: selected service names
   - `channelType`: "website"
   - `bookingDate`: selected datetime
   - `status`: "pending"
   - `staff_id`: selected staff (optional)
3. Trigger n8n webhook to notify salon via WhatsApp
4. Show confirmation page with booking details

### 4.7 Gallery Page (`/gallery`)

- Masonry grid of all images from `Gallery` table
- Category filter tabs (hair, nails, makeup, skincare)
- Lightbox on click (full-screen image viewer)
- Lazy loading for performance

### 4.8 Cart Page (`/cart`)

- List of cart items (stored in Zustand + localStorage)
- Each item: image, name, price, quantity ± controls, remove button
- Subtotal calculation
- "أكمل الطلب" button → /checkout

### 4.9 Checkout Page (`/checkout`)

**Form fields:**
- Full name (required)
- Phone number (required)
- Delivery address (required for delivery)
- Notes (optional)

**Payment method selector:**
- 💵 نقداً عند التوصيل (Cash on Delivery)
- 📱 كليك CliQ (manual bank transfer — show details)
- 💳 بطاقة ائتمان (Card via Paymob)

**On submit:**
1. Create `Order` in database:
   ```json
   {
     "customerName": "...",
     "customerPhone": "...",
     "customerAddress": "...",
     "items": [{"productId": "...", "name": "...", "price": 10, "qty": 2}],
     "subtotal": 20,
     "deliveryFee": 2,
     "total": 22,
     "paymentMethod": "cash|cliq|card",
     "paymentStatus": "unpaid",
     "status": "pending"
   }
   ```
2. **If cash:** Show "Order confirmed! We'll contact you." → redirect to /checkout/success
3. **If cliq:** Show CliQ details + "Upload receipt" → redirect to /checkout/success
4. **If card:** Call `/api/payment/intent` → redirect to Paymob iframe

### 4.10 CMS Pages (`/about`, `/contact`, `/privacy`, `/terms`)

- Query `CmsPage` table by slug
- Render HTML content
- Contact page adds: salon address (from `SystemSetting`), Google Maps embed, phone/WhatsApp links

---

## 5. Paymob Payment Integration

### 5.1 Payment Flow

```
Customer → Checkout → Select "Card" → 
  Frontend calls /api/payment/intent →
    Backend: 
      1. POST /api/auth/tokens (get auth token)
      2. POST /api/ecommerce/orders (register order)
      3. POST /api/acceptance/payment_keys (get payment key)
    Backend returns: { paymentKey, iframeUrl } →
  Frontend: redirect to Paymob iframe URL →
    Customer enters card details →
      Paymob processes payment →
        Paymob calls /api/payment/webhook (POST) →
          Backend: verify HMAC → update Order.paymentStatus = "paid" →
        Paymob redirects customer to /checkout/success?order_id=xxx
```

### 5.2 API: `/api/payment/intent/route.ts`

```typescript
// POST — Create Paymob payment intention
export async function POST(req: NextRequest) {
  const { orderId } = await req.json();

  // 1. Fetch the order from DB
  const order = await supabase.from("Order").select("*").eq("id", orderId).single();

  // 2. Authenticate with Paymob
  const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: process.env.PAYMOB_API_KEY }),
  });
  const { token } = await authRes.json();

  // 3. Register order with Paymob
  const paymobOrderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: token,
      delivery_needed: false,
      amount_cents: Math.round(order.data.total * 100), // Convert JOD to fils
      currency: "JOD",
      merchant_order_id: order.data.orderCode,
      items: order.data.items.map((item) => ({
        name: item.name,
        amount_cents: Math.round(item.price * 100),
        quantity: item.qty,
      })),
    }),
  });
  const paymobOrder = await paymobOrderRes.json();

  // 4. Get payment key
  const paymentKeyRes = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: token,
      amount_cents: Math.round(order.data.total * 100),
      expiration: 3600,
      order_id: paymobOrder.id,
      billing_data: {
        first_name: order.data.customerName.split(" ")[0] || "N/A",
        last_name: order.data.customerName.split(" ").slice(1).join(" ") || "N/A",
        phone_number: order.data.customerPhone,
        email: "customer@gardenia.com",
        country: "JO",
        city: "Amman",
        street: order.data.customerAddress || "N/A",
        building: "N/A",
        floor: "N/A",
        apartment: "N/A",
        state: "N/A",
        shipping_method: "N/A",
        postal_code: "N/A",
      },
      currency: "JOD",
      integration_id: parseInt(process.env.PAYMOB_INTEGRATION_ID!),
    }),
  });
  const { token: paymentKey } = await paymentKeyRes.json();

  // 5. Return iframe URL
  const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;

  return NextResponse.json({
    iframeUrl,
    paymentKey,
    paymobOrderId: paymobOrder.id,
  });
}
```

### 5.3 API: `/api/payment/webhook/route.ts`

```typescript
// POST — Paymob transaction callback
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { obj } = body;

  // 1. Verify HMAC signature
  const hmac = req.nextUrl.searchParams.get("hmac");
  const calculatedHmac = computeHmac(obj, process.env.PAYMOB_HMAC_SECRET!);

  if (hmac !== calculatedHmac) {
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 403 });
  }

  // 2. Check if transaction was successful
  if (obj.success === true) {
    const merchantOrderId = obj.order?.merchant_order_id;

    // 3. Update order payment status
    await supabase
      .from("Order")
      .update({ paymentStatus: "paid" })
      .eq("orderCode", merchantOrderId);
  }

  return NextResponse.json({ success: true });
}

function computeHmac(obj: any, secret: string): string {
  const crypto = require("crypto");
  // Paymob HMAC fields in alphabetical order
  const fields = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    obj.order?.id,
    obj.owner,
    obj.pending,
    obj.source_data?.pan,
    obj.source_data?.sub_type,
    obj.source_data?.type,
    obj.success,
  ];

  const concatenated = fields.join("");
  return crypto.createHmac("sha512", secret).update(concatenated).digest("hex");
}
```

---

## 6. Cart State Management (Zustand)

```typescript
// lib/cart-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  stock: number | null;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const existing = get().items.find((i) => i.productId === item.productId);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId
                ? { ...i, qty: Math.min(i.qty + 1, i.stock ?? 999) }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, qty: 1 }] });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      updateQty: (productId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId
              ? { ...i, qty: Math.min(qty, i.stock ?? 999) }
              : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    { name: "gardenia-cart" }
  )
);
```

---

## 7. Design System

### Color Palette (matches dashboard)
```css
:root {
  --sage: #778a7e;
  --sage-light: #e8ede9;
  --sand: #b09e7c;
  --sand-light: #f3efe8;
  --terracotta: #d9703e;
  --terracotta-light: #fbe8dc;
  --cream: #faf8f5;
  --dark: #2a2a2a;
}
```

### Typography
- Headings: **Tajawal** (Arabic serif — elegant feel)
- Body: **Cairo** or **IBM Plex Sans Arabic** (clean readability)
- Prices: **tabular-nums** for alignment

### Layout
- **RTL-first** — All layouts start Arabic
- **Mobile-first** — 375px → 768px → 1024px → 1440px
- **Max-width:** 1280px centered container
- **Grid:** CSS Grid for catalog, Flexbox for everything else

### Component Style
- Cards: rounded-2xl, subtle shadow, hover scale(1.02)
- Buttons: rounded-xl, primary = terracotta, secondary = sage
- Badges: pill shape, semi-transparent backgrounds
- Images: object-cover, lazy loading, blur placeholder

---

## 8. SEO & Performance

### Meta Tags (per page)
```tsx
export const metadata = {
  title: "صالون جاردينيا | خدمات تجميل احترافية في الأردن",
  description: "احجزي خدمات التجميل من تصفيف الشعر والأظافر والمكياج. توصيل للمنزل.",
  openGraph: {
    title: "صالون جاردينيا",
    description: "...",
    images: ["/og-image.jpg"],
    locale: "ar_JO",
    type: "website",
  },
};
```

### Performance Checklist
- [ ] Next.js `Image` component for all images (automatic WebP, lazy loading)
- [ ] Server Components for all data-fetching pages
- [ ] Client Components only where interactivity needed (cart, booking form)
- [ ] `generateStaticParams` for service/product detail pages (ISR)
- [ ] Font subsetting for Arabic fonts

---

## 9. n8n Webhook Integration

When a booking or order is created from the website:

### Booking Webhook
```json
POST https://your-n8n.com/webhook/gardenia-booking
{
  "type": "new_booking",
  "bookingId": "uuid",
  "clientName": "سارة أحمد",
  "clientPhone": "962799999999",
  "service": "قص شعر + صبغة",
  "date": "2026-05-15T14:00:00",
  "location": "salon",
  "source": "website"
}
```

### Order Webhook
```json
POST https://your-n8n.com/webhook/gardenia-order
{
  "type": "new_order",
  "orderCode": "GRD-20260501-001",
  "customerName": "سارة أحمد",
  "customerPhone": "962799999999",
  "total": 45,
  "paymentMethod": "card",
  "items": [{"name": "شامبو كيراستاس", "qty": 2, "price": 15}],
  "source": "website"
}
```

n8n will send a WhatsApp notification to the salon admin.

---

## 10. Deployment Plan

```
gardenia-website/
├── Deployed on: VPS (same server as dashboard) or Vercel
├── Domain: gardenia-salon.com (or subdomain: shop.gardenia-salon.com)
├── Reverse Proxy: Caddy or Nginx
│   ├── gardenia-salon.com → website (port 3001)
│   └── admin.gardenia-salon.com → dashboard (port 3000)
```

### Caddy Configuration
```caddyfile
gardenia-salon.com {
    reverse_proxy localhost:3001
}

admin.gardenia-salon.com {
    reverse_proxy localhost:3000
}
```

---

## 11. Implementation Order

| Step | Task | Depends On | Est. Time |
|---|---|---|---|
| 1 | Scaffold Next.js project + Tailwind + fonts | Nothing | 30 min |
| 2 | Build Layout (Header + Footer + WhatsApp button) | Step 1 | 2 hrs |
| 3 | Build Homepage (Hero + Featured + Gallery preview) | Step 2 | 3 hrs |
| 4 | Build Services page + detail page | Step 2 | 3 hrs |
| 5 | Build Products page + detail page | Step 2 | 2 hrs |
| 6 | Build Cart (Zustand store + drawer + page) | Step 5 | 2 hrs |
| 7 | Build Checkout + Order creation | Step 6 | 3 hrs |
| 8 | Integrate Paymob payment | Step 7 | 3 hrs |
| 9 | Build Booking flow (multi-step form) | Step 4 | 4 hrs |
| 10 | Build Gallery page | Step 2 | 1 hr |
| 11 | Build CMS pages (About, Contact, Privacy, Terms) | Step 2 | 1 hr |
| 12 | n8n webhook notifications | Step 7, 9 | 1 hr |
| 13 | SEO + performance optimization | All | 2 hrs |
| 14 | Testing + deployment | All | 3 hrs |

**Total estimated: ~30 hours**

---

## 12. Required Paymob Setup (Before Development)

Before we start building, you need to:

1. **Log into Paymob Dashboard** → https://accept.paymob.com
2. **Get these 4 values:**
   - `PAYMOB_API_KEY` — Settings → API Key
   - `PAYMOB_INTEGRATION_ID` — Integrations → Card Integration ID
   - `PAYMOB_IFRAME_ID` — iFrames → Your iframe ID
   - `PAYMOB_HMAC_SECRET` — Settings → HMAC Secret
3. **Set callback URL** in Paymob dashboard:
   - Transaction processed callback: `https://gardenia-salon.com/api/payment/webhook`
4. **Test in sandbox** first with Paymob test cards

---

## 13. Test Checklist

- [ ] Homepage loads with real services from DB
- [ ] Services page shows correct prices + offer badges
- [ ] Products page shows stock status
- [ ] Add to cart works (persists across page refresh)
- [ ] Cart quantity controls work (min 1, max = stock)
- [ ] Checkout form validates required fields
- [ ] Cash order creates record in dashboard
- [ ] Card payment redirects to Paymob iframe
- [ ] Paymob webhook updates order to "paid"
- [ ] Booking form creates record in dashboard
- [ ] n8n webhook sends WhatsApp notification
- [ ] CMS pages render correct content
- [ ] Gallery displays all images with category filter
- [ ] Mobile responsive (375px, 414px, 768px)
- [ ] RTL layout correct on all pages
- [ ] Page load < 3 seconds
- [ ] All meta tags present for SEO
