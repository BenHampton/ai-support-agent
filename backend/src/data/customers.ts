import type { Customer } from '@shared/types'

export const CUSTOMERS: Customer[] = [
  {
    customerId: 'consumer-us',
    name: 'Alex Rivera',
    tier: 'consumer',
    region: 'us',
    accountStatus: 'active',
    products: ['Ark Series NX-14 Laptop'],
    purchaseDate: '2026-06-16',
    entitlements: ['1-year-warranty', 'standard-support']
  },
  {
    customerId: 'consumer-eu',
    name: 'Sophie Müller',
    tier: 'consumer',
    region: 'eu',
    accountStatus: 'active',
    products: ['Ark Series NX-15 Laptop'],
    purchaseDate: '2026-04-24',
    entitlements: ['1-year-warranty', 'standard-support']
  },
  {
    customerId: 'smb-us',
    name: 'Marcus Chen',
    tier: 'smb',
    region: 'us',
    accountStatus: 'active',
    products: ['ArkBook Pro 14 x10', 'ArkCloud Business 10-seat'],
    purchaseDate: '2025-09-01',
    entitlements: ['nbd-support', 'hardware-warranty-2yr', 'arkcloud-business']
  },
  {
    customerId: 'smb-eu',
    name: 'Lena Kovač',
    tier: 'smb',
    region: 'eu',
    accountStatus: 'active',
    products: ['ArkBook Pro 13 x5', 'ArkCloud Business 5-seat'],
    purchaseDate: '2025-11-15',
    entitlements: ['nbd-support', 'hardware-warranty-2yr', 'arkcloud-business', 'gdpr-dpa']
  },
  {
    customerId: 'enterprise-us',
    name: 'Jordan Patel',
    tier: 'enterprise',
    region: 'us',
    accountStatus: 'active',
    products: ['ARK-R Series 4U Rack Server x12', 'ArkCloud Enterprise'],
    purchaseDate: '2024-03-01',
    entitlements: ['4hr-response-sla', 'onsite-support', '3yr-hardware-warranty', 'named-csm', 'arkcloud-enterprise']
  },
  {
    customerId: 'enterprise-eu',
    name: 'Ingrid Sørensen',
    tier: 'enterprise',
    region: 'eu',
    accountStatus: 'active',
    products: ['ARK-R Series 2U Rack Server x8', 'ArkCloud Enterprise'],
    purchaseDate: '2024-06-01',
    entitlements: ['4hr-response-sla', 'onsite-support', '3yr-hardware-warranty', 'named-csm', 'gdpr-dpa', 'arkcloud-enterprise']
  },
  {
    customerId: 'vip-us',
    name: 'Taylor Okafor',
    tier: 'vip',
    region: 'us',
    accountStatus: 'active',
    products: ['ArkBook Pro 16 x50', 'ARK-R Series 4U x4', 'ArkCloud VIP'],
    purchaseDate: '2023-01-15',
    entitlements: ['1hr-response-sla', 'dedicated-support-pod', 'onsite-support', 'white-glove-onboarding', 'arkcloud-vip']
  },
  {
    customerId: 'vip-eu',
    name: 'Claudia Ferreira',
    tier: 'vip',
    region: 'eu',
    accountStatus: 'active',
    products: ['ArkBook Pro 14 x30', 'ArkCloud VIP'],
    purchaseDate: '2023-05-20',
    entitlements: ['1hr-response-sla', 'dedicated-support-pod', 'white-glove-onboarding', 'gdpr-dpa', 'arkcloud-vip']
  }
]
