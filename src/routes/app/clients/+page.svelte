<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'

  // Import components
  import Navbar from '$lib/components/Navbar.svelte'

  // Import utility functions
  import { test } from '$lib/utils'

  // Import props
  export let data

  // Import stores
  import { testStore, loadTestStore } from '$lib/stores/test'
  import { clients, loadClients } from '$lib/stores/clients.js'

  // Execute onMount
  onMount(() => {
    loadTestStore()
    loadClients(data.supabase)
  })

  // Component specific variables and business logic
</script>

<div class="mt-10 flex justify-center">
  <div class="ml-10 mr-10 bg-base-100 p-4 shadow-xl">
    <h1 class="mb-2 text-center text-3xl font-bold">3PL Clients</h1>
    <div class="mb-4 flex justify-center">
      <button on:click={() => console.log('HELLO')} class="btn btn-outline btn-primary btn-sm"
        >Add Client <i class="fas fa-plus"></i>
      </button>
    </div>
    <table class="table table-zebra">
      <thead>
        <tr>
          <th>Company Name</th>
          <th>Username</th>
          <th>Password</th>
          <th>Actions</th>
          <!-- <th>Per Order Fee</th>
          <th>Per Unit Fee</th>
          <th>FBA Pack and Prep</th>
          <th>WFS Pack and Prep</th>
          <th>B2B Freight Percentage Markup</th> -->
        </tr>
      </thead>
      <tbody>
        {#each $clients as client}
          <tr>
            <td>{client.company_name}</td>
            <td>{client.username}</td>
            <td>{client.password}</td>
            <td
              ><div class="flex space-x-1">
                <button class="btn btn-info btn-sm">Edit</button><button
                  class="btn btn-error btn-sm">Delete</button
                >
                <button class="btn btn-sm">View Billing Terms</button>
              </div></td
            >
            <!-- <td>{client.per_order_fee}</td>
            <td>{client.per_order_unit_fee}</td>
            <td>{client.per_unit_fba_pack_prep}</td>
            <td>{client.per_unit_wfs_pack_prep}</td>
            <td>{client.b2b_freight_percentage_markup}</td> -->
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
