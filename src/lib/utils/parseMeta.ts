interface Metadata {
    tags: string[];
}

export function parseMetadata(jsonMetadata: string): Metadata {
    try {
        return JSON.parse(jsonMetadata);
    } catch (error) {
        console.error("Failed to parse JSON metadata:", error);
        return { tags: [] };
    }
}