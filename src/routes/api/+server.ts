import { connectToDatabase } from '$lib/db';
import type { RequestHandler } from '@sveltejs/kit';
import sql from 'mssql';

interface RequestBody {
	language?: string;
	searchTerm?: string;
	bodyLen?: number;
	tagsToExclude?: string[];
	minPayout?: number;
	maxPayout?: number;
	showPayoutWindowOnly?: boolean;
	author?: string;
	authorExclude?: string;
	tags?: string[];
	excludeUpvotedBy?: string[];
	excludeApps?: string[];
	excludeTitle?: string[];
	minReputation?: number | null;
	maxReputation?: number | null;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		await connectToDatabase();

		const body: RequestBody = await request.json();

		let searchTerm = body.searchTerm ?? '';

		const {
			language = 'en',
			bodyLen: minBodyLength = 0,
			tagsToExclude = [],
			minPayout = 0,
			maxPayout = 0,
			minReputation = 25,
			maxReputation = null,
			showPayoutWindowOnly = true,
			author = '',
			authorExclude = '',
			tags = [],
			excludeUpvotedBy = [],
			excludeApps = [],
			excludeTitle = []
		} = body ?? {};

		const sqlRequest = new sql.Request();

		sqlRequest.input('language', sql.NVarChar, language);
		sqlRequest.input('minPayout', sql.Decimal(18, 3), minPayout);

		if (searchTerm) {
			if (searchTerm.includes(' ')) {
				searchTerm = `"${searchTerm.replace(/"/g, '""')}"`;
			} else {
				searchTerm = searchTerm.replace(/"/g, '""');
			}
		}

		const searchTermCondition = searchTerm
			? searchTerm.includes(' ')
				? `AND CONTAINS((c.body, c.title), @searchTerm)`
				: `AND (CONTAINS(c.body, @searchTerm) OR CONTAINS(c.title, @searchTerm))`
			: '';

		const authorNames = author
			.split(',')
			.map((name) => name.trim())
			.filter((name) => name !== '');
		const authorExcludeNames = authorExclude
			.split(',')
			.map((name) => name.trim())
			.filter((name) => name !== '');

		const authorCondition =
			authorNames.length > 0
				? `AND c.author IN (${authorNames.map((_, i) => `@author${i}`).join(', ')})`
				: '';

		const excludeUpvotedByCondition =
			excludeUpvotedBy.length > 0
				? `AND NOT EXISTS (
              SELECT 1
              FROM OPENJSON(c.active_votes) WITH (voter nvarchar(255) '$.voter')
              WHERE voter IN (${excludeUpvotedBy.map((_, i) => `@excludeUpvotedBy${i}`).join(', ')})
          )`
				: '';

		const authorExcludeCondition =
			authorExcludeNames.length > 0
				? `AND NOT c.author IN (${authorExcludeNames.map((_, i) => `@authorExclude${i}`).join(', ')})`
				: '';

		excludeUpvotedBy.forEach((username, i) => {
			sqlRequest.input(`excludeUpvotedBy${i}`, sql.NVarChar, username);
		});

		authorNames.forEach((name, i) => {
			sqlRequest.input(`author${i}`, sql.NVarChar, name);
		});

		authorExcludeNames.forEach((name, i) => {
			sqlRequest.input(`authorExclude${i}`, sql.NVarChar, name);
		});

		const bodyLengthCondition = minBodyLength > 0 ? `AND LEN(c.body) >= @bodyLength` : '';
		const payoutWindowCondition = author
			? ''
			: showPayoutWindowOnly || !searchTerm
				? `AND c.created > DATEADD(day, -2, GETUTCDATE())`
				: '';

		const payoutCondition =
			maxPayout > 0
				? `AND TRY_CONVERT(DECIMAL, c.pending_payout_value, 1) BETWEEN @minPayout AND @maxPayout`
				: `AND TRY_CONVERT(DECIMAL, c.pending_payout_value, 1) >= @minPayout`;

		let tagsCondition = '';
		if (tags.length > 0) {
			const tagPlaceholders = tags.map((_, i) => `@includeTag${i}`).join(', ');
			tags.forEach((tag, i) => {
				sqlRequest.input(`includeTag${i}`, sql.NVarChar, tag);
			});
			tagsCondition = `AND EXISTS (
                        SELECT 1
                        FROM OPENJSON(c.json_metadata, '$."tags"')
                        WHERE value IN (${tagPlaceholders})
                    )`;
		}

		if (maxPayout > 0) {
			sqlRequest.input('maxPayout', sql.Decimal(18, 3), maxPayout);
		}

		if (searchTerm) {
			sqlRequest.input('searchTerm', sql.NVarChar, searchTerm);
		}

		sqlRequest.input('bodyLength', sql.Int, minBodyLength);

		const excludeTagPlaceholders = tagsToExclude.map((_, i) => `@excludeTag${i}`).join(', ');

		const excludeTagsCondition =
			tagsToExclude.length > 0
				? `AND NOT EXISTS (
            SELECT 1 
            FROM OPENJSON(c.json_metadata, '$."tags"') 
            WHERE value IN (${excludeTagPlaceholders})
        )`
				: '';

		tagsToExclude.forEach((tag, i) => {
			sqlRequest.input(`excludeTag${i}`, sql.NVarChar, tag);
		});

		const excludeAppPlaceholders = excludeApps.map((_, i) => `@excludeApps${i}`).join(', ');

		const excludeAppsCondition =
			excludeApps.length > 0
				? `AND NOT EXISTS (
        SELECT 1 
        FROM OPENJSON(c.json_metadata, '$."apps"') 
        WHERE LOWER(value) IN (${excludeAppPlaceholders})
    )`
				: '';

		excludeApps.forEach((app, i) => {
			sqlRequest.input(`excludeApps${i}`, sql.NVarChar, app);
		});

		let excludeTitleCondition = '';
		if (excludeTitle.length > 0) {
			excludeTitleCondition = excludeTitle
				.map((_, i) => `LOWER(c.title) NOT LIKE @excludeTitle${i}`)
				.join(' AND ');

			excludeTitle.forEach((title, i) => {
				sqlRequest.input(`excludeTitle${i}`, sql.NVarChar, `%${title.toLowerCase()}%`);
			});

			excludeTitleCondition = `AND (${excludeTitleCondition})`;
		}

		let reputationCondition = `
            ${minReputation ? `AND a.reputation_ui >= @minReputation` : ''}
        `;

		sqlRequest.input('minReputation', sql.Int, minReputation ?? 25);

		if (maxReputation !== null && maxReputation !== undefined) {
			sqlRequest.input('maxReputation', sql.Int, maxReputation);
			reputationCondition += `AND a.reputation_ui <= @maxReputation`;
		}

		const query = ` 
    SELECT 
        c.title,
        COALESCE(FLOOR(a.reputation_ui), 0) AS reputation,
        c.author,
        c.url,
        c.created,
        c.pending_payout_value,
        c.json_metadata,
        c.body_length,
        c.author_rewards,
        c.total_payout_value,
        c.body,
        CASE 
            WHEN cm.title IS NOT NULL THEN cm.title
            ELSE '#' + c.category
        END AS displaycategory
    FROM 
        Comments c
    LEFT JOIN 
        Communities cm ON c.category = cm.name
    LEFT JOIN
        Accounts a ON c.author = a.name
    WHERE 
        c.depth = 0
        AND c.allow_curation_rewards = 1 
        AND ISJSON(c.json_metadata) = 1
        ${searchTermCondition}
        ${bodyLengthCondition}
        ${authorExcludeCondition}
        ${authorCondition}
        ${tagsCondition}
        ${excludeUpvotedByCondition}
        AND EXISTS (
            SELECT 1 
            FROM OPENJSON(c.body_language)
            WITH (
                language NVARCHAR(50) '$.language',
                isReliable BIT '$.isReliable'
            ) 
            WHERE language = @language AND isReliable = 1
        )
        ${excludeTagsCondition}
        ${payoutWindowCondition}
        ${payoutCondition}
        ${excludeAppsCondition}
        ${excludeTitleCondition}
        ${reputationCondition}
    ORDER BY 
        c.created DESC
    OFFSET 0 ROWS
    FETCH NEXT 600 ROWS ONLY;
`;

		const result = await sqlRequest.query(query);

		return new Response(
			JSON.stringify({
				posts: result.recordset
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
	} catch (error) {
		console.error('Database query failed:', error);
		return new Response(JSON.stringify({ error: 'Database query failed' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
};