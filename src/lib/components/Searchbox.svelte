<script lang="ts">
    import { searchTerm } from '$lib/utils/storageUtils';

    let inputValue = '';

    function handleSearch() {
        searchTerm.set(inputValue);
    }
</script>

<div class="flex flex-col">
    <label for="search-input" class="sr-only">Search</label>
    <input id="search-input" type="text" bind:value={inputValue} class="border py-1 px-2 mb-1 text-neutral-800" placeholder="Type something...">
    <button type="button" class="bg-black border border-neutral-500 text-gray-200 py-1 rounded-sm" on:click={handleSearch}>Search</button>
</div>
