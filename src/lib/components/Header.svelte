<script lang="ts">
    import MainNav from "$lib/components/MainNav.svelte";
    import Logo from "$lib/assets/Shape.svg";
</script>

<header class="flex justify-between items-center text-white p-4 border-b border-neutral-900 sticky top-0 z-10 bg-neutral-950"> 
    <div class="flex gap-2 items-center">
        <img src={Logo} alt="Logo">    
        <h1 class="font-bold">HiveLookup</h1>
    </div>
    <MainNav />
</header>