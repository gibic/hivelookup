<script lang="ts">
	import Searchbox from '$lib/components/Searchbox.svelte';
    import Cog from '$lib/assets/gear.svg';
    import { showModal } from '$lib/utils/storageUtils';

    function handleModal() {
        $showModal = true;
    }
</script>
<aside class="p-4 w-[250px] sticky top-20">
	<Searchbox />
    <button class="w-full text-right my-4 text-sm font-medium flex justify-end items-center gap-2" on:click={handleModal}>
        <img src={Cog} alt="gear icon" width="16">
        Edit search parameters
    </button>
</aside>
