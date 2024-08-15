<script>
  import { enhance } from '$app/forms'

  export let form

  let isLoading = false

  $: email = form?.email ?? ''
</script>

<div class="flex flex-1 flex-col items-center justify-center">
  <form
    method="post"
    class="ml-6 mr-6 mt-10 w-96 rounded-lg bg-base-100 p-6 shadow-md"
    use:enhance={() => {
      isLoading = true
      form = null
      return async ({ update }) => {
        isLoading = false
        update()
      }
    }}
  >
    <h1 class="mb-4 text-center text-2xl font-bold">Log in</h1>
    <label class="mb-2 block">
      <input
        class="input input-bordered w-full"
        name="email"
        type="email"
        value={email}
        placeholder="Email"
      />
    </label>
    <label class="mb-4 block">
      <input
        class="input input-bordered w-full"
        name="password"
        type="password"
        placeholder="Password"
      />
    </label>
    {#if form?.message}
      <p class="mb-4 text-error">{form.message}</p>
    {/if}
    <button type="submit" class="btn btn-primary w-full" disabled={isLoading}>
      {isLoading ? 'Loading...' : 'Submit'}
    </button>
  </form>
</div>
