import { readFileSync } from 'fs'
import { join } from 'path'
import type { Customer } from '@shared/types'
import { DATA_DIR } from '../config.ts'

// mock CRM — customers seeded from external data; swap this read for a real Salesforce call
const CUSTOMERS = JSON.parse(readFileSync(join(DATA_DIR, 'customers.json'), 'utf-8')) as Customer[]

export const getCustomer = async (customerId: string): Promise<Customer> => {
  const customer = CUSTOMERS.find((c) => c.customerId === customerId)
  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`)
  }
  return customer
}

export const listCustomers = async (): Promise<Customer[]> => {
  return CUSTOMERS
}
