import type { KnowledgeArticle } from '@shared/types'

export const ARTICLES: KnowledgeArticle[] = [
  {
    id: 'return-policy-us',
    title: 'Return Policy — United States',
    category: 'returns',
    tags: ['return', 'refund', 'rma', 'us', 'policy', 'money back'],
    content: `Ark Systems offers a 30-day return window for all products purchased directly from arksystems.com or an authorized Ark Systems retail partner. To be eligible for a return, the product must be in its original, unopened condition or deemed defective by our support team. Products purchased from third-party resellers are subject to that reseller's return policy and are not eligible for a direct Ark Systems return.

To initiate a return, customers must contact Ark Systems Support to obtain a Return Merchandise Authorization (RMA) number. Returns shipped without an RMA number will be refused. Once your RMA is issued, you will receive a prepaid shipping label if the return is due to a defect or error on our part; customer-initiated returns for non-defective products require the customer to cover return shipping costs.

Refunds are processed within 5–10 business days of receiving the returned item at our warehouse. Refunds are issued to the original payment method. Items returned outside the 30-day window or without an RMA number are not eligible for a refund and will be shipped back to the customer at their expense.`
  },
  {
    id: 'return-policy-eu',
    title: 'Return Policy — European Union',
    category: 'returns',
    tags: ['return', 'refund', 'eu', 'policy', 'statutory', 'withdrawal', 'gdpr'],
    content: `Under EU consumer protection law (Directive 2011/83/EU), Ark Systems customers in the European Union have a statutory right of withdrawal of 14 days from the date of delivery. This right applies to all distance and off-premises contracts, regardless of the product's condition, and supersedes any shorter Ark Systems product-specific policy. You do not need to provide a reason to exercise your right of withdrawal.

To exercise your right of withdrawal, you must notify Ark Systems in writing before the 14-day period expires. Submit a withdrawal request through your Ark Systems account portal or email eu-returns@arksystems.com. Once confirmed, you have a further 14 days to return the product. Ark Systems will reimburse all payments received, including standard delivery charges, within 14 days of receiving the returned product or proof of shipment.

For returns after the 14-day statutory window, EU customers may still be eligible for a warranty-based return if the product is defective. All personal data collected during the purchase and return process is handled in accordance with our GDPR Privacy Policy.`
  },
  {
    id: 'gdpr-data-privacy-eu',
    title: 'GDPR Data Privacy — EU Customer Rights',
    category: 'compliance',
    tags: ['gdpr', 'privacy', 'eu', 'data', 'compliance', 'legal', 'regulation', 'retention', 'erasure'],
    content: `Ark Systems is committed to full compliance with the General Data Protection Regulation (GDPR) for all customers in the European Union and European Economic Area. As a data controller, Ark Systems processes your personal data only for specified, lawful purposes including order fulfillment, support case management, product warranty administration, and service improvement. We do not sell your personal data to third parties.

You have the following rights under GDPR: the right to access your personal data, the right to rectification of inaccurate data, the right to erasure ("right to be forgotten"), the right to restrict processing, the right to data portability, and the right to object to processing. To exercise any of these rights, submit a request through your Ark Systems account portal or contact our Data Protection Officer at dpo@arksystems.com. We will respond to all verified requests within 30 days.

Data retention periods: transactional records are retained for 7 years to comply with EU accounting requirements; support case records are retained for 3 years; marketing consent records are retained until consent is withdrawn plus 1 year. All data is stored in EU-region infrastructure. If you believe we have processed your data unlawfully, you have the right to lodge a complaint with your national supervisory authority.`
  },
  {
    id: 'warranty-claim-process',
    title: 'Warranty Claim Process',
    category: 'warranty',
    tags: ['warranty', 'repair', 'claim', 'hardware', 'defect', 'rma', 'serial number', 'proof of purchase'],
    content: `Ark Systems hardware products are covered by a limited warranty against defects in materials and workmanship. Consumer products carry a 1-year warranty from the date of purchase. Enterprise-tier hardware (including ARK-R Series servers and NAS appliances) carries a 3-year warranty. Warranty coverage applies only to products purchased directly from Ark Systems or an authorized reseller and is non-transferable.

To file a warranty claim you will need: (1) proof of purchase — order confirmation or invoice, (2) the product serial number found on the device label or in your account portal under Registered Products, and (3) a description of the defect. Submit your claim through the Ark Systems Support portal. Our team will validate eligibility and issue a case number within 1 business day.

Depending on your tier and product type, warranty repair is handled via depot service or on-site service. Enterprise customers with active SLA entitlements are prioritized for on-site service. Depot turnaround is typically 5–7 business days. Ark Systems covers parts, labor, and return shipping for defective units under warranty. Physical damage, misuse, and unauthorized modifications void the warranty.`
  },
  {
    id: 'arkcloud-billing-faq',
    title: 'ArkCloud Billing — Frequently Asked Questions',
    category: 'billing',
    tags: ['billing', 'invoice', 'subscription', 'arkcloud', 'charge', 'dispute', 'proration', 'payment'],
    content: `ArkCloud subscriptions are billed on either a monthly or annual cycle depending on the plan selected at signup. Invoices are generated on the first day of each billing period and are available in your ArkCloud account portal under Billing > Invoice History. Each invoice includes a breakdown by service (compute, storage, managed services) and any usage overages. All invoices reference a unique Invoice ID in the format ARK-YYYY-XXXXXX.

Proration applies when you upgrade or downgrade your ArkCloud plan mid-cycle. Upgrades are prorated immediately and charged to your payment method within 24 hours. Downgrades take effect at the start of the next billing cycle and appear as a credit on your next invoice. Cancellations initiated mid-cycle do not generate a refund for the unused portion under standard terms; annual plan customers may be eligible for a partial refund — contact billing support for details.

To dispute a charge, locate the Invoice ID in your portal and submit a dispute through Billing > Dispute a Charge. Include the Invoice ID, the specific line item in question, and a brief explanation. Consumer and SMB customers resolve disputes through the self-serve portal. Enterprise customers should contact their named Customer Success Manager. VIP customers receive billing dispute resolution from the dedicated support pod within 1 business hour.`
  },
  {
    id: 'arkcloud-eu-outage',
    title: 'ArkCloud EU Region — Active Incident: Latency Degradation',
    category: 'incidents',
    tags: ['outage', 'incident', 'eu', 'arkcloud', 'latency', 'degradation', 'down', 'service', 'disruption'],
    content: `ACTIVE INCIDENT — Last updated: 2026-06-23 18:00 UTC. Ark Systems is currently investigating elevated latency and intermittent request timeouts in the ArkCloud EU-WEST-1 and EU-CENTRAL-1 regions. Affected services include ArkCloud Compute API, Managed Storage read operations, and the ArkCloud web dashboard. ArkCloud EU-NORTH-1 is operating normally. US and APAC regions are unaffected.

Root cause investigation is ongoing. Preliminary analysis points to a networking configuration change deployed during the scheduled maintenance window at 14:00 UTC that caused unexpected routing asymmetry between availability zones. Our infrastructure team has identified the affected components and is rolling back the change. Estimated time to full recovery: 2026-06-23 20:30 UTC.

Workaround: Customers with multi-region ArkCloud configurations can temporarily redirect traffic to EU-NORTH-1 or US-EAST-1 by updating their endpoint in ArkCloud Console > Settings > Region Preferences. All impacted customers will receive an SLA credit for the affected period — credits are applied automatically at month end. Subscribe to status.arksystems.com for real-time updates.`
  },
  {
    id: 'laptop-desktop-troubleshooting',
    title: 'Ark Series Laptop & Desktop — Troubleshooting Guide',
    category: 'troubleshooting',
    tags: ['laptop', 'desktop', 'troubleshooting', 'boot', 'screen', 'reset', 'diagnostics', 'repair', 'hardware'],
    content: `This guide covers common hardware and software issues for Ark Series consumer notebooks and ArkBook Pro business laptops. Before contacting support, run the built-in Ark Diagnostics tool by pressing F12 during boot and selecting "Run Diagnostics." The tool checks memory, storage, display, and thermal sensors and generates a diagnostic report code you can share with our support team.

For boot failures: if the device does not power on, confirm the AC adapter is seated correctly and try a hard reset (hold power for 15 seconds, release, then press once). If the device powers on but fails to reach the OS, boot into Ark Recovery (F8 during startup) to access system restore and factory reset options. Factory reset erases all user data — back up important files before proceeding. ArkBook Pro devices enrolled in corporate MDM require IT administrator approval before factory reset.

For display issues such as dead pixels, backlight failure, or screen artifacts: run the display diagnostic from Ark Diagnostics. If the issue is confirmed as a hardware defect and the device is within warranty, file a warranty claim for depot or on-site repair. Screen replacement outside of warranty is available through the Ark Systems Repair Centre — use the Repair Estimator at arksystems.com/repair for pricing. Liquid damage and physical cracks are not covered under standard warranty.`
  },
  {
    id: 'server-storage-support',
    title: 'ARK-R Series Servers & Storage — Support Guide',
    category: 'enterprise-hardware',
    tags: ['server', 'storage', 'raid', 'firmware', 'enterprise', 'ark-r', 'nas', 'troubleshooting', 'iark'],
    content: `The ARK-R Series rack servers and NAS storage appliances are sold exclusively to B2B customers and are supported through the Ark Systems Enterprise Support Portal at enterprise.arksystems.com. All enterprise hardware ships with iARK — Ark's integrated remote management controller — which provides out-of-band access for monitoring, firmware updates, and remote console even when the OS is unresponsive.

Common ARK-R Series issues: (1) RAID array degraded — if a drive fails, iARK sends an alert to the registered admin email within 5 minutes. Replace the failed drive with an Ark-qualified replacement; the array rebuilds automatically. Do not power cycle during rebuild. (2) Boot failure after firmware update — access iARK remote console and use the Ark Firmware Recovery Tool to restore the previous firmware version. A rollback package is bundled with every firmware release. (3) Memory ECC errors — check iARK hardware logs for DIMM slot errors; multiple errors on the same DIMM indicate hardware failure.

Firmware updates for ARK-R Series hardware must be applied through iARK or the Ark Systems Enterprise Update Manager — never apply firmware directly from the OS. Always check the Ark Compatibility Matrix before updating. Emergency firmware support is available 24/7 for Enterprise and VIP customers through the enterprise support line.`
  },
  {
    id: 'enterprise-sla-tiers',
    title: 'Enterprise Support SLA Tiers',
    category: 'support',
    tags: ['sla', 'enterprise', 'vip', 'smb', 'response-time', 'escalation', 'csm', 'support', 'tier'],
    content: `Ark Systems offers tiered support SLAs matched to each customer segment. SMB customers receive Next-Business-Day (NBD) response for hardware issues and email/chat support with a 4-hour response window during business hours (9am–6pm local time, Monday–Friday). SMB support is handled by the general support queue and does not include a named Customer Success Manager.

Enterprise customers receive a 4-hour response SLA for P1/P2 incidents, 24/7 phone support for critical hardware failures, and a named Customer Success Manager who serves as the primary contact for account health, renewals, and escalations. Enterprise customers also have access to the Ark Systems Enterprise Support Portal for submitting cases, accessing firmware and driver updates, and scheduling on-site support visits. On-site hardware repair is available within 24 hours in covered metro areas.

VIP customers receive a 1-hour response SLA with a dedicated support pod — a named team of engineers with deep familiarity with the customer's environment. VIP incidents are never handled by a general queue. VIP customers also receive proactive health checks, priority access to beta firmware, and a dedicated Slack channel for real-time communication. Billing disputes for VIP accounts must always be handled by the dedicated pod and escalated to a human agent — never resolved through self-serve tooling.`
  },
  {
    id: 'billing-dispute-escalation',
    title: 'Billing Dispute Escalation Process',
    category: 'billing',
    tags: ['billing', 'dispute', 'escalation', 'invoice', 'refund', 'csm', 'vip', 'self-serve', 'portal'],
    content: `Ark Systems has a tiered billing dispute process based on customer tier. Consumer and SMB customers should initiate disputes through the self-serve Billing Dispute portal at arksystems.com/billing/dispute. You will need your Invoice ID (format: ARK-YYYY-XXXXXX), the disputed amount, and a brief explanation. The portal accepts disputes within 90 days of the invoice date. Most disputes are resolved within 5 business days; if the portal review does not resolve the issue, the case is automatically escalated to the billing specialist team.

Enterprise customers should contact their named Customer Success Manager directly to initiate a billing dispute. The CSM will open a priority case with the Ark Systems Finance team and provide updates within 24 hours. Enterprise billing disputes involving annual contract true-ups or usage overage calculations may take up to 10 business days due to additional review. CSMs are authorized to apply provisional credits up to $5,000 while the dispute is under review.

VIP customers must never be directed to self-serve billing tools for dispute resolution. All VIP billing issues must be handled by the dedicated support pod and escalated to a human agent immediately. The VIP pod has direct access to the Finance escalation queue and will engage the customer's account executive if needed. Response time for VIP billing issues is within 1 business hour with resolution targeted within 1 business day.`
  }
]
