<script lang="ts">
	import { onMount } from 'svelte';
	import { parseMetadata } from '$lib/utils/parseMeta';
	import { timeAgo } from '$lib/utils/timeFormat';
	import type { Post, Metadata, FetchDataOptions } from '$lib/types';
	import Loading from '$lib/components/Loading.svelte';
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
	} from '$lib/utils/storageUtils';
	import { get } from 'svelte/store';

	interface APIResponse {
		totalCount: number;
		posts: Post[];
	}

	let totalCount = 0;
	let posts: (Post & { metadata: Metadata })[] = [];
	let loading = true;
	let initialLoadDone = false;
	let uiBaseUrl = '';
	let search = '';
	let minBodyLength = 0;
	let minPayoutValue = 0;
	let maxPayoutValue = 0;
	let tagsToExcludeArr = [];
	let tagsToIncludeArr = [];
	let authorsToIncludeArr = [];
	let authorsToExcludeArr = [];
	let excludeUpvotedByArr = [];
	let currentPage = 1; 
	let pageSize = 10;

	$: minBodyLength = $bodyLen;
	$: search = $searchTerm;
	$: minPayoutValue = $minPayout;
	$: maxPayoutValue = $maxPayout;
	$: tagsToExcludeArr = $tagsToExclude;
	$: tagsToIncludeArr = $tagsToInclude;
	$: authorsToIncludeArr = $authorsToInclude;
	$: authorsToExcludeArr = $authorsToExclude;
	$: excludeUpvotedByArr = $excludeUpvotedBy;

	$: if (initialLoadDone) {
		fetchData({
			language: get(selectedLanguage),
			searchTerm: search,
			bodyLen: minBodyLength,
			minPayout: minPayoutValue,
			maxPayout: minPayoutValue,
			tagsToExclude: tagsToExcludeArr,
			tags: tagsToIncludeArr,
			author: get(authorsToInclude).join(', '),
			authorExclude: get(authorsToExclude).join(', '),
			excludeUpvotedBy: excludeUpvotedByArr,
			page: currentPage,
			pageSize: 10
		});
	}

	$: uiBaseUrl = $selectedUI;

	async function fetchData({
		language,
		searchTerm = '',
		bodyLen = 0,
		minPayout = 0,
		maxPayout = 0,
		tagsToExclude = [],
		tags = [],
		author = '',	
		authorExclude = '',
		excludeUpvotedBy = [],
		page = 1,
		pageSize = 10
	}: FetchDataOptions) {
		loading = true;
		try {
			const requestBody = {
				language,
				searchTerm,
				bodyLen,
				minPayout,
				maxPayout,
				tagsToExclude,
				tags,
				author,
				authorExclude,
				excludeUpvotedBy,
				page,
				pageSize
			};

			const res = await fetch('/api', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestBody)
			});

			if (res.ok) {
				const responseData: APIResponse = await res.json();
				if (Array.isArray(responseData.posts)) {
					processPosts(responseData.posts);
					totalCount = responseData.totalCount;
				} else {
					console.error('Unexpected response structure:', responseData);
					posts = [];
					totalCount = 0;
				}
			} else {
				console.error('Failed to fetch data with status:', res.status);
				posts = [];
				totalCount = 0;
			}
		} catch (error) {
			console.error('Error fetching data:', error);
			posts = [];
			totalCount = 0;
		} finally {
			setTimeout(() => (loading = false), 1000);
		}
	}

	function processPosts(responseData: Post[]) {
		posts = responseData.map((post) => ({
			...post,
			metadata: parseMetadata(post.json_metadata)
		}));
	}

	onMount(() => {
		initializeSettings();

		fetchData({
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
			page: currentPage,
			pageSize: pageSize
		}).then(() => {
			initialLoadDone = true;
		});

		selectedLanguage.subscribe(async (newLanguage) => {
			if (initialLoadDone) {
				await fetchData({
					language: newLanguage,
					searchTerm: get(searchTerm),
					bodyLen: get(bodyLen),
					minPayout: get(minPayout),
					maxPayout: get(maxPayout),
					tagsToExclude: get(tagsToExclude),
					tags: get(tagsToInclude),
					author: get(authorsToInclude).join(', '),
					authorExclude: get(authorsToExclude).join(', '),
					excludeUpvotedBy: get(excludeUpvotedBy),
					page: currentPage,
					pageSize: 10
				});
			}
		});
	});

	function getTags(post: Post) {
		if (!post.displaycategory.startsWith('#')) {
			return post.metadata?.tags?.slice(1) ?? [];
		}
		return post.metadata?.tags ?? [];
	}

	function nextPage() {
		currentPage += 1;
		fetchData({
			language: get(selectedLanguage),
			searchTerm: get(searchTerm),
			bodyLen: get(bodyLen),
			tagsToExclude: get(tagsToExclude),
			tags: get(tagsToInclude),
			author: get(authorsToInclude).join(', '),
			authorExclude: get(authorsToExclude).join(', '),
			excludeUpvotedBy: get(excludeUpvotedBy),
			page: currentPage,
			pageSize: pageSize
		});
	}

	function previousPage() {
		if (currentPage > 1) {
			currentPage -= 1;
			fetchData({
				language: get(selectedLanguage),
				searchTerm: get(searchTerm),
				bodyLen: get(bodyLen),
				tagsToExclude: get(tagsToExclude),
				tags: get(tagsToInclude),
				author: get(authorsToInclude).join(', '),
				authorExclude: get(authorsToExclude).join(', '),
				excludeUpvotedBy: get(excludeUpvotedBy),
				page: currentPage,
				pageSize: pageSize
			});
		}
	}
</script>

{#if loading}
	<Loading />
{:else}
	<ul class="mb-4 w-full">
		<div class="sticky top-16 bg-neutral-950 pb-4 mb-2 border-b border-neutral-800">
			<h2 class="font-semibold mb-5 sticky top-16 bg-neutral-950">
				Showing {posts.length} of {totalCount} results
			</h2>
			<div class="flex justify-between">
				<button on:click={previousPage} disabled={currentPage === 1}>Previous</button>
				<span>Page {currentPage}</span>
				<button on:click={nextPage} disabled={currentPage * pageSize >= totalCount}>Next</button>
			</div>
		</div>

		{#each posts as post}
			<li class="border-b border-neutral-900 py-2 hover:bg-neutral-900 pr-4">
				<div class="flex justify-between mb-2">
					<div class="text-sm">
						<a href="{uiBaseUrl}/@{post.author}" target="_blank"
							>{post.author} ({post.reputation})</a
						>
						<br />
						<span class="text-xs">
							Body length: {post.body_length} characters
						</span>
					</div>
					<div class="flex flex-col items-end">
						<span class="text-xs">{timeAgo(post.created)}</span>
						{#if !post.displaycategory.startsWith('#')}
							<span class="bg-teal-700 rounded-md my-2 py-1 px-2 text-[11px]">
								C / {post.displaycategory}
							</span>
						{/if}
					</div>
				</div>
				<div class="w-3/4">
					<a href="{uiBaseUrl}{post.url}" target="_blank" class="font-semibold">
						{post.title}
					</a>
					<br />
					<span class="text-xs">{post.pending_payout_value} Hive Rewards</span>
				</div>
				<div class="mt-2">
					{#if getTags(post).length}
						<ul class="flex flex-wrap mt-2">
							{#each getTags(post) as tag}
								<li class="bg-gray-700 border-gray-600 p-1 mr-2 mb-1 text-xs rounded-md">#{tag}</li>
							{/each}
						</ul>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
{/if}
