# Paddle Billing to HubSpot CRM Webhook Sync (Open Source Example)

[![CI](https://github.com/smartprov05/paddle-hubspot-sync/actions/workflows/ci.yml/badge.svg)](https://github.com/smartprov05/paddle-hubspot-sync/actions/workflows/ci.yml)

A clean reference implementation demonstrating how to verify Paddle Billing webhooks and synchronize subscription status, live MRR, and renewal dates into **HubSpot CRM**.

---

## The Gap: Why Paddle Users Need Custom CRM Sync

HubSpot's native payment processing tool connects natively with **Stripe**. However, global B2B SaaS companies frequently use **Paddle** as their Merchant of Record (MoR) to handle global VAT/sales tax compliance, multi-currency checkout, and invoicing without setting up tax entities in 50 countries.

Because HubSpot does not offer a native Paddle integration, SaaS teams have no direct visibility into customer subscriptions, plan upgrades, or failed payment dunning inside HubSpot CRM.

This repository demonstrates how to:
1. Validate Paddle Billing HMAC-SHA256 signatures (`Paddle-Signature` header).
2. Parse subscription events (`subscription.created`, `subscription.updated`, `subscription.canceled`).
3. Search and patch matching HubSpot Contact and Company properties using the HubSpot REST API.

---

## Edge Cases When Building Custom Webhook Integrations

When building and maintaining a custom Paddle-to-HubSpot webhook service in production, you must account for:
- **Webhook Retry Queues:** Paddle retries failed deliveries for up to 3 days; your endpoint must be idempotent to prevent duplicate updates.
- **HubSpot API Rate Limits:** Spikes in webhook events (e.g., month-end renewals) can quickly trigger `429 Too Many Requests` on standard HubSpot portals without distributed queuing.
- **Currency Normalization:** Paddle supports 30+ billing currencies; multi-currency SaaS companies need unified USD or EUR reporting in CRM.
- **Embedded Rep UI:** Custom scripts update background properties, but reps still lack visual CRM cards displaying recent transactions and 1-click subscription management.
- **Historical Backfill:** Webhooks only capture future events; existing customers require full historical migration.

---

## The Turnkey Alternative: Paddle Sync for HubSpot

If you prefer a fully managed, zero-maintenance integration instead of hosting serverless webhook listeners, check out **Paddle Sync**:

- **Real-Time 2-Way Sync:** Automatically syncs subscription plan, live MRR/ARR, seat counts, next payment date, and cancellation status to HubSpot.
- **Embedded CRM Cards:** Reps see active Paddle subscriptions, plan tiers, and transaction history right inside the Contact and Company page.
- **Automated Dunning Workflows:** Instantly flags `past_due` status to trigger automated HubSpot dunning emails and sales follow-up tasks.
- **12-Month Historical Backfill:** Imports existing Paddle customers and transaction history on install.
- **Free Tier:** Supports up to 50 active subscriptions for free.

👉 **Install and test:** [Paddle Sync for HubSpot](https://kayabyte.dev/hubspot/paddle-sync/?src=c-gh-paddle)  
*(Not affiliated with Paddle.com. Submitted to the HubSpot Marketplace and currently in review)*.
