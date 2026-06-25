import type { Customer } from '@shared/types'
import { CUSTOMERS } from '../data/customers.ts'

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
