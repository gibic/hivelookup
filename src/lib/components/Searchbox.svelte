<script lang="ts">
    import { saveSettings, searchTerm, showPayoutWindowOnly } from '$lib/utils/storageUtils';

    let inputValue = '';
    let checked: boolean;

    // Initialize checked state from the store
    showPayoutWindowOnly.subscribe(value => {
        checked = value;
    });

    function handleSearch() {
        searchTerm.set(inputValue);
    }

    function handleCheckboxChange() {
        showPayoutWindowOnly.set(checked);
        saveSettings({ showPayoutWindowOnly: checked });
    }
</script>

<div class="flex flex-col">
    <label for="search-input" class="sr-only">Search</label>
    <input id="search-input" type="text" bind:value={inputValue} class="border py-1 px-2 mb-1 text-neutral-800" placeholder="Type something...">
    <button type="button" class="bg-black border border-neutral-500 text-gray-200 py-1 rounded-sm" on:click={handleSearch}>Search</button>
    <label class="flex items-center cursor-pointer my-4">
        <input
          type="checkbox"
          class="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          bind:checked={checked}
          on:change={handleCheckboxChange}        
        />
        <span class="ml-2 text-gray-400 text-xs">Show within payout window</span>
      </label>
</div>
