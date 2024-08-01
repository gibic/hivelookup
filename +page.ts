import type { PageLoad } from './$types';
import type { Data } from '$lib/types';

export const load: PageLoad<{ data: Data }> = async ({ fetch, url }) => {
    const language = url.searchParams.get('language') || 'en';

    const requestBody = { language };
    console.log('Fetching data for language:', language);
    console.log('Sending request to API with body:', requestBody);

    try {
        const res = await fetch('/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        console.log('Response status:', res.status); // Log the response status

        if (res.ok) {
            const responseData: Data = await res.json();
            return { data: responseData };
        } else {
            console.error('Failed to fetch data with status:', res.status);
            return { data: { data: [] } }; // Return a default structure on failure
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        return { data: { data: [] } }; // Handle fetch errors
    }
};
