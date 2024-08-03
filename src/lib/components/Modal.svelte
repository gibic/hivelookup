<script lang="ts">
	import {
		showModal,
		bodyLen,
		saveSettings,
		maxPayout,
		minPayout,
		tagsToExclude,
		tagsToInclude,
		authorsToInclude,
		authorsToExclude,
		excludeUpvotedBy,
		excludeApps,
		excludeTitle,
		searchTriggered,
	} from '$lib/utils/storageUtils';
	import closeIcon from '$lib/assets/circle-xmark-regular.svg';
	import { get } from 'svelte/store';

	let bodyLengthValue = get(bodyLen) || 0;
	let maxPayoutValue = get(maxPayout) || 0;
	let minPayoutValue = get(minPayout) || 0;
	let excludedTagsString = get(tagsToExclude)?.join(', ') || '';
    let includeTagsString = get(tagsToInclude)?.join(', ') || '';
    let includeAuthorsString = get(authorsToInclude)?.join(', ') || '';
    let excludeAuthorsString = get(authorsToExclude)?.join(', ') || '';
    let excludeUpvotedByString = get(excludeUpvotedBy)?.join(', ') || '';
	let excludedAppsString = get(excludeApps)?.join(', ') || '';
	let excludeTitleString = get(excludeTitle)?.join(', ') || '';

	let showToast = false;

    function handleListInputChange(event: Event, store: any, shouldRemoveSymbol?: string) {
        const target = event.target as HTMLInputElement;
        if (target) {
            const value = target.value;
            const itemsArray = value
                .split(',')
                .map(item => item.trim())
                .map(item => shouldRemoveSymbol ? item.replace(shouldRemoveSymbol, '') : item)
                .filter(item => item !== '');
            store.set(itemsArray);
        }
    }

	function handleInputChange(event: Event, store: (value: number) => void) {
		const target = event.target as HTMLInputElement | null;
		if (target) {
			const value = target.valueAsNumber;
			store(value);
		}
	}

	function handleModal() {
		$showModal = false;
	}

	function saveParameters() {
		saveSettings({
			bodyLen: bodyLengthValue,
			maxPayout: maxPayoutValue,
			minPayout: minPayoutValue,
            tagsToInclude: get(tagsToInclude) || [],
			tagsToExclude: get(tagsToExclude) || [],
            authorsToInclude: get(authorsToInclude) || [],
            authorsToExclude: get(authorsToExclude) || [],
            excludeUpvotedBy: get(excludeUpvotedBy) || [],
			excludeApps: get(excludeApps) || [],
			excludeTitle: get(excludeTitle) || [],
		});

		showToast = true;
		searchTriggered.set(true);
		setTimeout(() => (showToast = false), 3000);

	}
</script>

<div class="fixed inset-0 bg-black p-5 z-20 text-white">
	<div class="container mx-auto">
		<header class="flex justify-between mb-5">
			<h3 class="font-bold">Edit search parameters</h3>
			<button on:click={handleModal}>
				<img src={closeIcon} alt="close" width="32" />
			</button>
		</header>
		<section class="grid grid-cols-4 gap-6">
			<div class="flex flex-col">
				<label for="minimum-chars">Minimum body length (characters)</label>
				<input
					id="minimum-chars"
					type="number"
					bind:value={bodyLengthValue}
					on:input={(event) => handleInputChange(event, bodyLen.set)}
					class="border py-1 px-2 mb-1 text-neutral-800"
					placeholder="1000"
				/>
			</div>
			<div class="flex flex-col">
				<label for="minrewards">Min Rewards</label>
				<input
					id="minrewards"
					type="number"
					bind:value={minPayoutValue}
					on:input={(event) => handleInputChange(event, minPayout.set)}
					class="border py-1 px-2 mb-1 text-neutral-800"
					placeholder="0"
				/>
			</div>
			<div class="flex flex-col">
				<label for="maxrewards">Max Rewards</label>
				<input
					id="maxrewards"
					type="number"
					bind:value={maxPayoutValue}
					on:input={(event) => handleInputChange(event, maxPayout.set)}
					class="border py-1 px-2 mb-1 text-neutral-800"
					placeholder="10"
				/>
			</div>
			<div class="flex flex-col">
				<label for="exclude-tags">Exclude Apps</label>
				<input
					id="exclude-apps"
					type="text"
					bind:value={excludedAppsString}
                    on:input={(event) => handleListInputChange(event, excludeApps)}
					class="border py-1 px-2 mb-1 text-neutral-800"
					placeholder="app1, app2, app3"
				/>
			</div>
			<div class="flex flex-col">
				<label for="exclude-tags">Not in title</label>
				<input
					id="exclude-title"
					type="text"
					bind:value={excludeTitleString}
                    on:input={(event) => handleListInputChange(event, excludeTitle)}
					class="border py-1 px-2 mb-1 text-neutral-800"
					placeholder="word 1, word 2, word 3"
				/>
			</div>
			<div class="flex flex-col">
				<label for="exclude-tags">Exclude Tags</label>
				<input
					id="exclude-tags"
					type="text"
					bind:value={excludedTagsString}
                    on:input={(event) => handleListInputChange(event, tagsToExclude)}
					class="border py-1 px-2 mb-1 text-neutral-800"
					placeholder="tag1, tag2, tag3"
				/>
			</div>
            <div class="flex flex-col">
				<label for="include-tags">Include Tags</label>
				<input
					id="include-tags"
					type="text"
					bind:value={includeTagsString}
                    on:input={(event) => handleListInputChange(event, tagsToInclude)}
					class="border py-1 px-2 mb-1 text-neutral-800"
					placeholder="tag1, tag2, tag3"
				/>
			</div>
            <div class="flex flex-col">
                <label for="include-authors">Include Authors (comma-separated)</label>
                <input
                    id="include-authors"
                    type="text"
                    bind:value={includeAuthorsString}
                    on:input={(event) => handleListInputChange(event, authorsToInclude, '@')}
                    class="border py-1 px-2 mb-1 text-neutral-800"
                    placeholder="author1, author2, author3"
                />
            </div>
            <div class="flex flex-col">
                <label for="exclude-authors">Exclude Authors (comma-separated)</label>
                <input
                    id="exclude-authors"
                    type="text"
                    bind:value={excludeAuthorsString}
                    on:input={(event) => handleListInputChange(event, authorsToExclude, '@')}
                    class="border py-1 px-2 mb-1 text-neutral-800"
                    placeholder="author1, author2, author3"
                />
            </div>
            <div class="flex flex-col">
                <label for="exclude-upvoted-by">Exclude Upvoted By (comma-separated)</label>
                <input
                    id="exclude-upvoted-by"
                    type="text"
                    bind:value={excludeUpvotedByString}
                    on:input={(event) => handleListInputChange(event, excludeUpvotedBy, '@')}
                    class="border py-1 px-2 mb-1 text-neutral-800"
                    placeholder="username1, username2, username3"
                />
            </div>
		</section>
		<footer class="mt-5">
			<button on:click={saveParameters} class="bg-blue-500 text-white py-2 px-4 rounded">
				Save search parameters
			</button>
		</footer>
	</div>
</div>

{#if showToast}
	<div
		class="toast fixed z-50 bg-purple-300 text-black top-5 w-3/4 left-1/2 -translate-x-1/2 rounded-lg p-2"
	>
		Parameters saved
	</div>
{/if}
