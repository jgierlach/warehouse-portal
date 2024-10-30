import { writable } from 'svelte/store'

export const selectedClientToInvoice = writable({})

export const setSelectedClientToInvoice = (client) => {
  selectedClientToInvoice.set(client)
}