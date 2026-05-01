# Gardenia AI Agent — Order & Booking Integration Guide

> **Purpose:** How to enable the Gardenia WhatsApp AI agent to create product orders and handle bookings using the new database tables.
> **Prerequisite:** Run `migration-v2.sql` in Supabase SQL Editor first.

---

## 1. Current State

The Gardenia AI agent (running in n8n) already has these capabilities:

| Capability | Status | Tool Name |
|---|---|---|
| Get all products/services | ✅ Working | `get_all_products_and_services` |
| Get product details by ID | ✅ Working | `get_product_details_by_id` |
| Create booking | ✅ Working | `create_booking` |
| Create product order | ❌ **Needs new tool** | — |
| Send payment link | ❌ **Optional enhancement** | — |

---

## 2. New Tool: Create Order

### 2.1 Add to n8n Agent

In your n8n AI Agent workflow, add a new **"Execute SQL"** or **"Supabase"** tool with the following configuration:

**Tool Name:** `create_order`

**Tool Description (for the AI):**
```
Use this tool when a customer wants to buy/purchase a product (not a service booking). 
Creates a product order. 
Required: customer name, customer phone, list of items with product IDs and quantities.
The order will be visible in the admin dashboard under "Orders".
Always confirm the order details with the customer before creating.
```

### 2.2 SQL Query

```sql
INSERT INTO "public"."Order" (
  "customerName",
  "customerPhone", 
  "customerAddress",
  "items",
  "subtotal",
  "deliveryFee",
  "total",
  "paymentMethod",
  "paymentStatus",
  "status",
  "notes"
) VALUES (
  '{{ $customerName }}',
  '{{ $customerPhone }}',
  '{{ $customerAddress }}',
  '{{ $items }}'::jsonb,
  {{ $subtotal }},
  {{ $deliveryFee }},
  {{ $total }},
  'cash',
  'unpaid',
  'pending',
  '{{ $notes }}'
)
RETURNING "id", "orderCode", "total", "status";
```

### 2.3 Items Format (JSONB)

The `items` field must be a valid JSON array:

```json
[
  {
    "productId": "uuid-of-product",
    "name": "شامبو كيراستاس",
    "price": 15,
    "qty": 2
  },
  {
    "productId": "uuid-of-product-2",
    "name": "كريم ترطيب",
    "price": 10,
    "qty": 1
  }
]
```

### 2.4 Expected Response

The query returns the auto-generated order code:

```json
{
  "id": "uuid",
  "orderCode": "GRD-20260501-003",
  "total": 40,
  "status": "pending"
}
```

The agent should reply to the customer with something like:
```
تم تأكيد طلبك بنجاح! 🎉
رقم الطلب: GRD-20260501-003
المبلغ الإجمالي: 40 دينار أردني
طريقة الدفع: نقداً عند التوصيل
سنتواصل معك قريباً لتأكيد التوصيل 💚
```

---

## 3. Update System Prompt

Add this section to the Gardenia system prompt (the one in n8n):

```
## Product Orders (NEW)

When a customer wants to BUY a product (not book a service):

1. Use `get_all_products_and_services` to find the product and confirm availability
2. Check stock: if the product has stock = 0 or null, tell the customer it's out of stock
3. Confirm the following with the customer BEFORE creating the order:
   - Product name(s) and quantities
   - Total price
   - Delivery address (if delivery is needed)
4. Use `create_order` tool to create the order
5. Share the order code with the customer

### Order vs Booking Decision Tree:
- Customer wants a SERVICE (haircut, nails, makeup) → Use `create_booking`
- Customer wants to BUY a PRODUCT (shampoo, cream, oil) → Use `create_order`
- Customer wants BOTH → Create a booking for the service AND an order for the product separately

### Delivery Options:
- "توصيل" (delivery) → Ask for the address, add delivery fee (2 JOD)
- "استلام من الصالون" (pickup) → No delivery fee, address = "استلام من الصالون"
```

---

## 4. Update Existing Booking Tool

The `Booking` table now has a new `staff_id` column. Update your existing booking tool:

### 4.1 Updated SQL

```sql
INSERT INTO "public"."Booking" (
  "client_id",
  "serviceSummary",
  "bookingDate",
  "status",
  "channelType",
  "staff_id",
  "area",
  "notes"
) VALUES (
  '{{ $clientId }}',
  '{{ $serviceSummary }}',
  '{{ $bookingDate }}'::timestamptz,
  'pending',
  'whatsapp',
  {{ $staffId || 'NULL' }},
  '{{ $area }}',
  '{{ $notes }}'
)
RETURNING "id", "serviceSummary", "bookingDate", "status";
```

### 4.2 Optional: Staff Assignment

If you want the AI to suggest a specific staff member:

```
Tool Name: get_available_staff
Description: Get list of available staff members and their schedules

SQL:
SELECT s."id", s."name", s."role", s."services",
       ss."dayOfWeek", ss."startTime", ss."endTime", ss."isOff"
FROM "public"."Staff" s
LEFT JOIN "public"."StaffSchedule" ss ON ss."staff_id" = s."id"
WHERE s."isActive" = true
ORDER BY s."name", ss."dayOfWeek";
```

The agent can then check if the requested date/time falls within a staff member's schedule.

---

## 5. Stock Awareness

Update the system prompt to handle stock checking:

```
## Stock Checking Rules

When a customer asks about a product:
1. Always use `get_all_products_and_services` or `get_product_details_by_id` to get fresh data
2. Check the `stock` field:
   - `stock = null` → This is a SERVICE (no stock tracking), available for booking
   - `stock = 0` → PRODUCT is OUT OF STOCK, tell the customer "هذا المنتج غير متوفر حالياً"
   - `stock > 0` → PRODUCT is available, the customer can order up to `stock` quantity
3. Never allow ordering more than the available stock quantity
```

---

## 6. Optional Enhancement: Payment Link via WhatsApp

If you want the agent to send a payment link for card payments:

### 6.1 Add a New n8n Tool: `generate_payment_link`

This tool calls your website's payment API:

```
Tool Name: generate_payment_link
Description: Generate a card payment link for an existing order. Use only when customer wants to pay by card.

HTTP Request:
  POST https://gardenia-salon.com/api/payment/intent
  Body: { "orderId": "{{ $orderId }}" }

Response: { "iframeUrl": "https://accept.paymob.com/..." }
```

### 6.2 Agent Response

When a customer wants to pay by card:

```
يمكنك الدفع بالبطاقة من خلال هذا الرابط 💳:
{{ $iframeUrl }}

الرابط صالح لمدة ساعة واحدة.
```

---

## 7. Complete Tool List for n8n Agent

After implementing everything, your agent should have these tools:

| # | Tool Name | Purpose | Status |
|---|---|---|---|
| 1 | `get_all_products_and_services` | Browse catalog with prices | ✅ Exists |
| 2 | `get_product_details_by_id` | Get single product details | ✅ Exists |
| 3 | `create_booking` | Create service reservation | ✅ Exists (update SQL) |
| 4 | `create_order` | Create product purchase | ⚠️ **Add this** |
| 5 | `get_available_staff` | Check staff availability | ⚠️ **Add this** (optional) |
| 6 | `generate_payment_link` | Send Paymob card link | ⚠️ **Add this** (optional) |

---

## 8. Conversation Flow Examples

### Example 1: Product Order

```
Customer: بدي شامبو كيراستاس
Agent: [uses get_all_products_and_services]
Agent: شامبو كيراستاس متوفر بسعر 15 دينار. كم حبة بتحبي تطلبي؟
Customer: 2
Agent: طيب يعني 2 × 15 = 30 دينار. بدك توصيل ولا استلام من الصالون؟
Customer: توصيل
Agent: تمام، شو عنوان التوصيل؟
Customer: عمان - الجبيهة - شارع الجامعة
Agent: رسوم التوصيل 2 دينار. المجموع 32 دينار.
       هل أتمم الطلب؟
       - 2× شامبو كيراستاس = 30 دينار
       - توصيل = 2 دينار
       - الإجمالي = 32 دينار
Customer: تمام
Agent: [uses create_order]
Agent: تم تأكيد طلبك بنجاح! 🎉
       رقم الطلب: GRD-20260501-003
       المبلغ: 32 دينار (نقداً عند التوصيل)
       سنتواصل معك قريباً 💚
```

### Example 2: Service Booking

```
Customer: بدي احجز صبغة شعر
Agent: [uses get_all_products_and_services]
Agent: صبغة الشعر متوفرة بسعر 35 دينار. 
       بتحبي في الصالون ولا بالبيت؟
Customer: بالصالون
Agent: تمام! شو اليوم والوقت المناسب إلك؟
Customer: يوم الأحد الساعة 2 الظهر
Agent: تمام، خليني أأكد:
       - صبغة شعر: 35 دينار
       - المكان: في الصالون
       - الموعد: الأحد 2026/05/04 الساعة 2:00 ظهراً
       أتمم الحجز؟
Customer: أيوا
Agent: [uses create_booking]
Agent: تم الحجز بنجاح! 📅
       موعدك يوم الأحد 4/5 الساعة 2:00 ظهراً
       العنوان: [salon address]
       منتظرينك! 💚
```

### Example 3: Product + Service Together

```
Customer: بدي احجز مانيكير وبدي اطلب كمان كريم ايدين
Agent: [uses get_all_products_and_services]
Agent: تمام! المانيكير بـ 12 دينار وكريم الإيدين بـ 8 دينار.
       خليني أرتب إلك الحجز والطلب سوا:
       
       📅 حجز المانيكير:
       شو اليوم والوقت المناسب؟
       
       🛒 طلب كريم الإيدين:
       بدك توصيل ولا تستلميه بالصالون يوم الحجز؟
Customer: يوم الثلاثاء 10 الصبح واستلم الكريم من الصالون
Agent: تمام:
       📅 مانيكير - الثلاثاء 6/5 الساعة 10:00 صباحاً - 12 دينار
       🛒 كريم إيدين × 1 - استلام من الصالون - 8 دينار
       الإجمالي: 20 دينار
       أأكد؟
Customer: أكد
Agent: [uses create_booking] + [uses create_order]
Agent: تم بنجاح! 🎉
       📅 حجز المانيكير: الثلاثاء 6/5 الساعة 10 صباحاً
       🛒 طلب كريم الإيدين: رقم الطلب GRD-20260506-001
       منتظرينك يوم الثلاثاء! 💚
```

---

## 9. Testing Checklist

- [ ] Agent correctly distinguishes between "booking a service" vs "ordering a product"
- [ ] `create_order` tool creates a record visible in dashboard `/orders`
- [ ] Order code is auto-generated (GRD-YYYYMMDD-NNN)
- [ ] Stock is checked before allowing order
- [ ] Agent refuses to order out-of-stock products
- [ ] Agent asks for delivery address when customer wants delivery
- [ ] Agent includes delivery fee (2 JOD) in total
- [ ] Agent confirms all details before creating order/booking
- [ ] Updated booking tool includes `staff_id` field
- [ ] `get_available_staff` returns correct schedule data
- [ ] Payment link generation works (if implemented)
- [ ] Both booking and order appear correctly in the admin dashboard
