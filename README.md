# Sparrow (Phase 1: no payments)

Next.js 14 + Supabase. Customers use `/app`, approved agents use `/agent`. Payments are Phase 2.

## Setup
1. Create a Supabase project. Auth > Providers > Email: turn off "Confirm email" while developing.
2. SQL editor: run `supabase/schema.sql`, then `supabase/migration_002_tracker_fee.sql` (tracker + delivery charge). Fresh install = both, in that order.
3. `cp .env.example .env.local` and fill in the URL and anon key.
4. `npm install && npm run dev`
5. Sign up two accounts. Promote one to agent (SQL at the bottom of `schema.sql`).

## Phase 1 flow
Pending Acceptance -> (agent claims, optional price change) -> Accepted -> Out for Delivery -> Delivered.
Internally "Accepted" is the `PAYMENT_VERIFIED` state. Phase 2: set `app_settings.payments_enabled = 'true'`,
claim then lands in `AWAITING_PAYMENT`, and you add the `payments` table, QR/UTR flow and webhook.

## Security model
- `middleware.ts` gates routes; `requireRole()` re-checks in every page and action.
- Postgres RLS is the real boundary. Orders have no client write policies; all writes go through
  `create_order / cancel_order / claim_order / advance_order` (atomic, role-checked).
- Agents see only hostel + item pre-claim. Room, phone and call notes live in `order_delivery_details`,
  readable only by the customer and the assigned agent.

## Known gaps before real users
- Agent price changes are not confirmed by the customer in Phase 1 (they only see the change). Fix in Phase 2 via payment.
- Order images use a public bucket with random paths and keep EXIF data. Move to signed URLs + EXIF stripping.
- Expired orders are only hidden, not marked `EXPIRED` (needs a cron).
- No admin UI, earnings page, rate limiting, or institute-email domain check. Order detail is an expandable card, not a modal.
- Realtime relies on Supabase Realtime + refresh on tab focus; no web push yet.

## Themes, tracker, delivery charge
- 11 themes in `globals.css` (`[data-theme=...]`). Default is Soft Neumorphic. Picker is in the customer drawer and the agent Theme panel; choice is stored in a cookie (per device).
- Tracker: 7 steps (Left IIT ... Delivery incoming) set by the assigned agent. Step 1 moves the order to Out for delivery. Handover is still "Mark delivered".
- Delivery charge: default 30 (`app_settings.default_delivery_fee`). The assigned agent can lower it (shown as new charge with the old one struck through), not raise it.
