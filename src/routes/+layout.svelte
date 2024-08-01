<script lang="ts">
	import Aside from '$lib/components/Aside.svelte';
	import Header from '$lib/components/Header.svelte';
	import Select from '$lib/components/Select.svelte';
	import { initializeSettings, saveSettings, selectedLanguage, selectedUI, showModal } from '$lib/utils/storageUtils';
    import { onMount } from 'svelte';
	import '../app.css';
	import {
		languageOptions,
		UIOptions,
		selectedValue as initialSelectedValue,
		selectedUIValue as initialSelectedUIValue,
	} from '$lib/config';
	import Modal from '$lib/components/Modal.svelte';

	let selectedValue = initialSelectedValue;
	let selectedUIValue = initialSelectedUIValue;

    onMount(() => {
        initializeSettings();

        selectedLanguage.subscribe(value => selectedValue = value);
        selectedUI.subscribe(value => selectedUIValue = value);
    });

	function handleLanguageChange(event: CustomEvent) {
		const { value } = event.detail;
        saveSettings({ selectedLanguage: value });
    }

	function handleUIChange(event: CustomEvent) {
		const { value } = event.detail;
        saveSettings({ selectedUI: value });
	}
</script>

<Header />
<section class="bg-neutral-950 text-white">
	<div class="container flex mx-auto">
		<div>
			<Aside />
		</div>
		<main class="p-4 flex gap-6 min-h-screen grow border-l border-r border-neutral-900">
			<slot></slot>
		</main>
		<section class="p-4 w-[250px] grow-0 shrink-0">
			<div class="sticky top-20">
				<div class="flex flex-col gap-4">
					<Select
						options={languageOptions}
						{selectedValue}
						on:selectChange={handleLanguageChange}
					/>
					<Select
						options={UIOptions}
						selectedValue={selectedUIValue}
						on:selectChange={handleUIChange}
					/>
				</div>
			</div>
		</section>
	</div>
</section>
<footer>
	<!-- Footer content -->
</footer>
{#if $showModal}
    <Modal />
{/if }
