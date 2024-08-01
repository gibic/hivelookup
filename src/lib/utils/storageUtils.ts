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
export const maxPayout = writable<number>(0);
export const minPayout = writable<number>(0);
export const tagsToExclude = writable<string[]>([]); 
export const tagsToInclude = writable<string[]>([]); 
export const showPayoutWindowOnly = writable<boolean>(true);
export const authorsToInclude = writable<string[]>([]);
export const authorsToExclude = writable<string[]>([]);
export const excludeUpvotedBy = writable<string[]>([]);


function setStoreValues(settings: Partial<AppSettings>) {
    if (settings.selectedLanguage !== undefined) {
        selectedLanguage.set(settings.selectedLanguage);
    }
    if (settings.selectedUI !== undefined) {
        selectedUI.set(settings.selectedUI);
    }
    if (settings.bodyLen !== undefined) {
        bodyLen.set(settings.bodyLen);
    }
    if (settings.maxPayout !== undefined) {
        maxPayout.set(settings.maxPayout);
    }
    if (settings.minPayout !== undefined) {
        minPayout.set(settings.minPayout);
    }
    if (settings.tagsToExclude !== undefined) {
        tagsToExclude.set(settings.tagsToExclude);
    }
    if (settings.tagsToInclude !== undefined) {
        tagsToInclude.set(settings.tagsToInclude);
    }
    if (settings.showPayoutWindowOnly !== undefined) {
        showPayoutWindowOnly.set(settings.showPayoutWindowOnly);
    }
    if (settings.authorsToInclude !== undefined) {
        authorsToInclude.set(settings.authorsToInclude);
    }
    if (settings.authorsToExclude !== undefined) {
        authorsToExclude.set(settings.authorsToExclude);
    }
    if (settings.excludeUpvotedBy !== undefined) {
        excludeUpvotedBy.set(settings.excludeUpvotedBy);
    }
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
        maxPayout: 0,
        minPayout: 0,
        tagsToExclude: [],
        tagsToInclude: [],
        showPayoutWindowOnly: true,
        authorsToInclude: [],
        authorsToExclude: [],
        excludeUpvotedBy: []
    });
}