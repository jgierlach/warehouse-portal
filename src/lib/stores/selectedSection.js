import { writable } from 'svelte/store'

export const selectedSection = writable('Invoices')

export const setSelectedSection = (text) => {
  selectedSection.set(text)
}
