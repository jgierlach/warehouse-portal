<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'

  // Import components
  import CreateInvoice from '$lib/components/CreateInvoice.svelte'

  // Import utility functions
  import { test } from '$lib/utils'

  // Import props
  export let data

  // Import stores
  import { clients, loadClients } from '$lib/stores/clients.js'
  import { selectedSection, setSelectedSection } from '$lib/stores/selectedSection.js'

  // Component specific variables and business logic
  $: activeClients = $clients.filter(
    (client) =>
      client.username !== 'wesley@hometown-industries.com' &&
      client.username !== 'susan@hometown-industries.com',
  )

  let selectedClient = {}

  // Execute onMount
  onMount(() => {
    loadClients(data.supabase)
  })
</script>

{#if $selectedSection === 'Invoices'}
  <div class="mt-10 flex justify-center">
    <div class="ml-10 mr-10 bg-base-100 p-4 shadow-xl">
      <h1 class="mb-2 text-center text-3xl font-bold">Client Invoicing</h1>
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Company Name</th>
            <th>Client Id</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each activeClients as client}
            <tr>
              <td>{client.company_name}</td>
              <td>{client.username}</td>
              <td
                ><div class="flex space-x-1">
                  <!-- <button
                    on:click={() => {
                      showClientBillingTermsModal = true
                      clientBillingTermsToDisplay = client
                    }}
                    class="btn btn-sm">View Billing Terms</button
                  > -->
                  <button
                    on:click={() => {
                      selectedClient = client
                      setSelectedSection('Create Invoice')
                    }}
                    class="btn btn-primary btn-sm">Create Invoice</button
                  >
                </div></td
              >
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}

{#if $selectedSection === 'Create Invoice'}
  <CreateInvoice supabase={data.supabase} {selectedClient} />
{/if}
