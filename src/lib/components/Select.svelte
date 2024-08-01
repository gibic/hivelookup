<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let options: { value: string, label: string }[] = [];
    export let selectedValue: string = '';

    const dispatch = createEventDispatcher();

    function handleChange(event: Event) {
        const value = (event.target as HTMLSelectElement).value;
        dispatch('selectChange', { value });
    }
</script>

<div>
    <select 
        bind:value={selectedValue} 
        on:change={handleChange}
        class="w-full p-2 bg-neutral-600 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
        {#each options as { value, label }}
            <option value={value}>{label}</option>
        {/each}
    </select>
</div>
