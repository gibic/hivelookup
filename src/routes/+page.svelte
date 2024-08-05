<script lang="ts">
	import { onMount } from 'svelte';
	import { parseMetadata } from '$lib/utils/parseMeta';
	import { timeAgo } from '$lib/utils/timeFormat';
	import type { Post, Metadata, FetchDataOptions } from '$lib/types';
	import Loading from '$lib/components/Loading.svelte';
	import HiveIcon from '$lib/assets/hive-blockchain-hive-logo.svg';
	import ImageIcon from '$lib/assets/image-solid.svg';
	import WordIcon from '$lib/assets/file-word-solid.svg';

	import {
		bodyLen,
		initializeSettings,
		searchTerm,
		selectedLanguage,
		selectedUI,
		minPayout,
		maxPayout,
		tagsToExclude,
		tagsToInclude,
		authorsToInclude,
		authorsToExclude,
		excludeUpvotedBy,
		excludeApps,
		excludeTitle,
		showPayoutWindowOnly,
		minReputation,
		maxReputation,
		saveSettings,
		getSettings,
		searchTriggered
	} from '$lib/utils/storageUtils';
	import { get } from 'svelte/store';

	interface APIResponse {
		posts: Post[];
	}

	let posts: (Post & { metadata: Metadata })[] = [];
	let loading = true;
	let initialLoadDone = false;
	let uiBaseUrl = '';
	let currentPage = 1;
	const pageSize = 10;

	$: uiBaseUrl = $selectedUI;

	function getFetchDataParams(): FetchDataOptions {
		return {
			language: get(selectedLanguage),
			searchTerm: get(searchTerm),
			bodyLen: get(bodyLen),
			minPayout: get(minPayout),
			maxPayout: get(maxPayout),
			tagsToExclude: get(tagsToExclude),
			tags: get(tagsToInclude),
			author: get(authorsToInclude).join(', '),
			authorExclude: get(authorsToExclude).join(', '),
			excludeUpvotedBy: get(excludeUpvotedBy),
			excludeApps: get(excludeApps),
			excludeTitle: get(excludeTitle),
			minReputation: get(minReputation),
			maxReputation: get(maxReputation),
			showPayoutWindowOnly: get(showPayoutWindowOnly)
		};
	}

	async function fetchData(params: FetchDataOptions, isPagination = false) {
		loading = true;
		try {
			const res = await fetch('/api', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(params)
			});

			if (res.ok) {
				const responseData: APIResponse = await res.json();
				if (Array.isArray(responseData.posts)) {
					processPosts(responseData.posts);
					if (!isPagination) {
						currentPage = 1; // Reset to the first page on new search
					}
				} else {
					console.error('Unexpected response structure:', responseData);
					posts = [];
				}
			} else {
				console.error('Failed to fetch data with status:', res.status);
				posts = [];
			}
		} catch (error) {
			console.error('Error fetching data:', error);
			posts = [];
		} finally {
			setTimeout(() => {
				loading = false;
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}, 1000);
		}
	}

	function processPosts(responseData: Post[]) {
		posts = responseData.map((post) => ({
			...post,
			metadata: parseMetadata(post.json_metadata),
			wordCount: countWords(post.body)
		}));
	}
	onMount(() => {
		initializeSettings();
		const initialSettings = getSettings();
		saveSettings(initialSettings);

		if (!initialLoadDone) {
			fetchData(getFetchDataParams()).then(() => {
				initialLoadDone = true;
			});
		}

		selectedLanguage.subscribe(async (newLanguage) => {
			if (initialLoadDone) {
				const params = { ...getFetchDataParams(), language: newLanguage };
				await fetchData(params);
			}
		});

		searchTriggered.subscribe(async (triggered) => {
			if (triggered && initialLoadDone) {
				await fetchData(getFetchDataParams());
				searchTriggered.set(false);
			}
		});
	});

	function getTags(post: Post) {
		if (!post.displaycategory.startsWith('#')) {
			return post.metadata?.tags?.slice(1) ?? [];
		}
		return post.metadata?.tags ?? [];
	}

	function changePage(increment: number) {
		currentPage = Math.max(1, currentPage + increment);
	}

	function nextPage() {
		changePage(1);
	}

	function previousPage() {
		changePage(-1);
	}

	function computeReward(post: Post) {
		const totalPayout = post.total_payout_value;
		const pendingPayout = post.pending_payout_value;

		if (totalPayout === 0 && pendingPayout === 0) {
			return '0';
		} else if (totalPayout !== 0) {
			return (totalPayout * 2).toFixed(2);
		} else {
			return pendingPayout.toFixed(2);
		}
	}

	function countImages(jsonMetadata: string): number {
		try {
			const metadata = JSON.parse(jsonMetadata);
			return Array.isArray(metadata.image) ? metadata.image.length : 0;
		} catch (error) {
			console.error('Error parsing json_metadata:', error);
			return 0;
		}
	}

	function stripHTMLAndMarkdown(content: string): string {
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = content;
		const textContent = tempDiv.textContent || tempDiv.innerText || '';
		const strippedContent = textContent.replace(/(\*|_|\~|\`|\#|\>|\!|\[|\])/g, '');
		return strippedContent;
	}

	function countWords(content: string): number {
		const strippedContent = stripHTMLAndMarkdown(content);
		return strippedContent.trim().split(/\s+/).length;
	}

	$: paginatedPosts = (() => {
		const start = (currentPage - 1) * pageSize;
		const end = Math.min(start + pageSize, posts.length);
		return posts.slice(start, end);
	})();
</script>

{#if loading}
	<Loading />
{:else}
	<ul class="mb-4 w-full">
		<div class="sticky top-16 bg-neutral-950 pb-4 mb-2 border-b border-neutral-800">
			<h2 class="font-semibold mb-5 sticky top-16 bg-neutral-950">
				{#if posts.length > pageSize}
					{Math.min(currentPage * pageSize, posts.length)} of {posts.length} results
				{:else if posts.length > 0}
					{posts.length} results
				{:else}
					No result
				{/if}
			</h2>
			<div class="flex justify-center gap-6 text-sm items-center">
				<button
					on:click={previousPage}
					disabled={currentPage === 1}
					class="py-1 px-2 w-32 {currentPage === 1 ? 'bg-gray-800 text-gray-600' : 'bg-gray-600'}"
				>
					Previous
				</button>
				<span>Page {currentPage}</span>
				<button
					on:click={nextPage}
					disabled={currentPage * pageSize >= posts.length}
					class="bg-gray-600 py-1 px-2 w-32 {currentPage * pageSize >= posts.length
						? 'bg-gray-800 text-gray-600'
						: 'bg-gray-600'}"
				>
					Next
				</button>
			</div>
		</div>

		{#each paginatedPosts as post}
			<li class="border-b border-neutral-900 py-2 hover:bg-neutral-900 pr-4">
				<div class="flex justify-between mb-2">
					<div class="text-sm">
						<a href="{uiBaseUrl}/@{post.author}" target="_blank"
							>{post.author} ({post.reputation})</a
						>
						<br />
						<div class="flex gap-4 my-2">
							<div class="flex gap-2">
								<img src={WordIcon} width="14" alt="words count" />
								<span>{post.wordCount}</span>
							</div>
							<div class="flex gap-2">
								<img src={ImageIcon} width="14" alt="images count" />
								<span>{countImages(post.json_metadata)}</span>
							</div>
						</div>
					</div>
					<div class="flex flex-col items-end">
						<span class="text-xs">{timeAgo(post.created)}</span>
						{#if !post.displaycategory.startsWith('#')}
							<span class="bg-teal-700 rounded-md my-2 py-1 px-2 text-[11px]"
								>C / {post.displaycategory}</span
							>
						{/if}
					</div>
				</div>
				<div class="w-3/4">
					<a href="{uiBaseUrl}{post.url}" target="_blank" class="font-semibold">{post.title}</a>
				</div>
				<div class="mt-2 flex justify-between">
					{#if getTags(post).length}
						<ul class="flex flex-wrap mt-2">
							{#each getTags(post) as tag}
								<li class="bg-gray-700 border-gray-600 p-1 mr-2 mb-1 text-xs rounded-md">#{tag}</li>
							{/each}
						</ul>
					{/if}
					<div class="text-xs flex gap-2 items-center ml-auto justify-end">
						{computeReward(post)} <img src={HiveIcon} width="18" alt="Hive icon" />
					</div>
				</div>
			</li>
		{/each}
	</ul>
{/if}
