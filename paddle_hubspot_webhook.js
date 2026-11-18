/**
 * Paddle Billing to HubSpot CRM Webhook Sync (Open Source Example)
 * 
 * Demonstrates how to verify Paddle Billing webhook signatures and update 
 * matching HubSpot Company and Contact records with live MRR, status, and subscription tier.
 * 
 * Built by Kayabyte (Independent Developer).
 * For a turnkey zero-code app with 12-month backfill and CRM cards:
 * https://kayabyte.dev/hubspot/paddle-sync/?src=c-gh-paddle
 */

import crypto from 'node:crypto';

// Verify Paddle v2 HMAC-SHA256 signature
export function verifyPaddleWebhook(rawBody, signatureHeader, secretKey) {
  if (!signatureHeader || !secretKey) return false;

  // Header format: ts=1671234567;h1=hashvalue...
  const parts = signatureHeader.split(';');
  const tsMatch = parts.find(p => p.startsWith('ts='));
  const h1Match = parts.find(p => p.startsWith('h1='));

  if (!tsMatch || !h1Match) return false;

  const timestamp = tsMatch.substring(3);
  const signature = h1Match.substring(3);
  const signedPayload = `${timestamp}:${rawBody}`;

  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(signedPayload)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

// Map Paddle subscription status to HubSpot properties
export function mapPaddleToHubSpot(paddleEvent) {
  const data = paddleEvent.data;
  const items = data.items || [];
  
  // Calculate total MRR in USD/EUR
  let recurringTotal = 0;
  for (const item of items) {
    if (item.recurring_proration) {
      recurringTotal += parseFloat(item.price.unit_price.amount) / 100;
    }
  }

  return {
    paddle_subscription_id: data.id,
    paddle_status: data.status, // active, trialing, past_due, paused, canceled
    paddle_customer_id: data.customer_id,
    paddle_currency: data.currency_code,
    paddle_mrr: recurringTotal.toFixed(2),
    paddle_next_billed_at: data.next_billed_at || '',
    paddle_canceled_at: data.canceled_at || '',
    paddle_collection_mode: data.collection_mode
  };
}

// Sync properties to HubSpot CRM via Search API and Patch
export async function syncToHubSpot(hubspotToken, customerEmail, properties) {
  const headers = {
    'Authorization': `Bearer ${hubspotToken}`,
    'Content-Type': 'application/json'
  };

  // 1. Find Contact by email
  const searchUrl = 'https://api.hubapi.com/crm/v3/objects/contacts/search';
  const searchBody = {
    filterGroups: [{
      filters: [{
        propertyName: 'email',
        operator: 'EQ',
        value: customerEmail
      }]
    }],
    limit: 1
  };

  const searchRes = await fetch(searchUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(searchBody)
  });
  const searchData = await searchRes.json();

  if (!searchData.results || searchData.results.length === 0) {
    console.log(`No HubSpot contact found matching email: ${customerEmail}`);
    return null;
  }

  const contactId = searchData.results[0].id;

  // 2. Update Contact with custom Paddle properties
  const updateUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`;
  const updateRes = await fetch(updateUrl, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ properties })
  });

  return updateRes.json();
}
