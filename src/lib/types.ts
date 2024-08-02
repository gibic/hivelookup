export interface Filters {
    language: string;
    ui: string;
}

export interface Metadata {
    app?: string;
    format?: string;
    tags?: string[];
    canonical_url?: string;
    links?: string[];
    images?: string[];
    isPoll?: boolean;
    dimensions?: Record<string, any>;
    description?: string;
    users?: string[];
    image?: string[];
    thumbnails?: string[];
    image_ratios?: number[];
}

export interface Post {
    title: string;
    reputation: number;
    author: string;
    url: string;
    created: string;
    pending_payout_value: number;
    json_metadata: string;
    metadata?: Metadata;
    displaycategory: string;
    body_length: number;
    total_payout_value: number;
}

export interface Data {
    data: Post[];
}

export interface FetchDataOptions {
    language: string;
    searchTerm?: string;
    bodyLen?: number;
    maxPayout?: number;
    minPayout?: number;
    tagsToExclude?: string[];
    tags?: string[];
    author?: string;    
    authorExclude?: string;   
    excludeUpvotedBy?: string[];
    showPayoutWindowOnly: boolean;
    page: number;
    pageSize: number;
}