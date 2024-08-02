import { writable } from 'svelte/store';

const STORAGE_KEY = 'appSettings';

type AppSettings = {
	selectedLanguage: string;
	selectedUI: string;
	bodyLen: number;
	maxPayout: number;
	minPayout: number;
	tagsToExclude: string[];
	tagsToInclude: string[];
	showPayoutWindowOnly: boolean;
	authorsToInclude: string[];
	authorsToExclude: string[];
	excludeUpvotedBy: string[];
	// Add other parameters as needed
};

// Initialize stores
export const showModal = writable<boolean>(false);
export const selectedLanguage = writable<string>('en');
export const selectedUI = writable<string>('https://peakd.com');
export const searchTerm = writable<string>('');
export const bodyLen = writable<number>(0);
export const maxPayout = writable<number>(undefined);
export const minPayout = writable<number>(undefined);
export const tagsToExclude = writable<string[]>([]);
export const tagsToInclude = writable<string[]>([]);
export const showPayoutWindowOnly = writable<boolean>(true);
export const authorsToInclude = writable<string[]>([]);
export const authorsToExclude = writable<string[]>([]);
export const excludeUpvotedBy = writable<string[]>([]);

const storeMap: {
	[K in keyof AppSettings]:
		| typeof selectedLanguage
		| typeof selectedUI
		| typeof bodyLen
		| typeof maxPayout
		| typeof minPayout
		| typeof tagsToExclude
		| typeof tagsToInclude
		| typeof showPayoutWindowOnly
		| typeof authorsToInclude
		| typeof authorsToExclude
		| typeof excludeUpvotedBy;
} = {
	selectedLanguage,
	selectedUI,
	bodyLen,
	maxPayout,
	minPayout,
	tagsToExclude,
	tagsToInclude,
	showPayoutWindowOnly,
	authorsToInclude,
	authorsToExclude,
	excludeUpvotedBy
};

function setStoreValues(settings: Partial<AppSettings>) {
	(Object.keys(settings) as (keyof AppSettings)[]).forEach((key) => {
		if (settings[key] !== undefined) {
			storeMap[key].set(settings[key] as never);
		}
	});
}

export function initializeSettings() {
	const settings = getSettings();
	setStoreValues(settings);
}

export function getSettings(): Partial<AppSettings> {
	const settings = localStorage.getItem(STORAGE_KEY);
	return settings ? JSON.parse(settings) : {};
}

export function saveSettings(settings: Partial<AppSettings>) {
	const currentSettings = getSettings();
	const newSettings = { ...currentSettings, ...settings };
	localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
	setStoreValues(newSettings);
}

export function resetSettings() {
	localStorage.removeItem(STORAGE_KEY);
	setStoreValues({
		selectedLanguage: 'en',
		selectedUI: 'https://peakd.com',
		bodyLen: 0,
		maxPayout: undefined,
		minPayout: undefined,
		tagsToExclude: [],
		tagsToInclude: [],
		showPayoutWindowOnly: true,
		authorsToInclude: [],
		authorsToExclude: [],
		excludeUpvotedBy: []
	});
}
