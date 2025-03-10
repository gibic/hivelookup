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

export const GET: RequestHandler = async () => {
	try {
		await connectToDatabase();
		return new Response(JSON.stringify({ status: 'connected' }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	} catch (error: unknown) {
		let errorMessage = 'An unknown error occurred';

		if (error instanceof Error) {
			errorMessage = error.message;
		} else if (typeof error === 'string') {
			errorMessage = error;
		}

		return new Response(JSON.stringify({ status: 'failed', error: errorMessage }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const pool = await connectToDatabase();

		const body: RequestBody = await request.json();
		const sqlRequest = pool.request();

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

		sqlRequest.input('language', sql.NVarChar, language);
		sqlRequest.input('minPayout', sql.Decimal(18, 3), minPayout);
		sqlRequest.input('bodyLength', sql.Int, minBodyLength);
		sqlRequest.input('minReputation', sql.Int, minReputation);

		if (maxPayout > 0) {
			sqlRequest.input('maxPayout', sql.Decimal(18, 3), maxPayout);
		}

		if (maxReputation !== null) {
			sqlRequest.input('maxReputation', sql.Int, maxReputation);
		}

		let searchTermCondition = '';
		if (body.searchTerm) {
			const searchTerm = body.searchTerm.includes(' ')
				? `"${body.searchTerm.replace(/"/g, '""')}"`
				: body.searchTerm.replace(/"/g, '""');
			sqlRequest.input('searchTerm', sql.NVarChar, searchTerm);
			searchTermCondition = `AND (CONTAINS(c.body, @searchTerm) OR CONTAINS(c.title, @searchTerm))`;
		}

		const authorCondition = buildCondition('c.author', author, sqlRequest, 'author');
		const authorExcludeCondition = buildCondition(
			'c.author',
			authorExclude,
			sqlRequest,
			'authorExclude',
			true
		);
		const tagsCondition = buildJsonCondition(
			'c.json_metadata',
			'tags',
			tags,
			sqlRequest,
			'includeTag'
		);
		const excludeTagsCondition = buildJsonCondition(
			'c.json_metadata',
			'tags',
			tagsToExclude,
			sqlRequest,
			'excludeTag',
			true
		);
		const excludeUpvotedByCondition = buildJsonCondition(
			'c.active_votes',
			'voter',
			excludeUpvotedBy,
			sqlRequest,
			'excludeUpvotedBy',
			true
		);
		const excludeAppsCondition = buildJsonCondition(
			'c.json_metadata',
			'apps',
			excludeApps,
			sqlRequest,
			'excludeApps',
			true
		);

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

		const payoutWindowCondition = showPayoutWindowOnly
			? `AND c.created > DATEADD(day, -2, GETUTCDATE())`
			: '';
		const payoutCondition =
			maxPayout > 0
				? `AND TRY_CONVERT(DECIMAL(18, 3), c.pending_payout_value) BETWEEN @minPayout AND @maxPayout`
				: `AND TRY_CONVERT(DECIMAL(18, 3), c.pending_payout_value) >= @minPayout`;
		const bodyLengthCondition = minBodyLength > 0 ? `AND LEN(c.body) >= @bodyLength` : '';
		const reputationCondition =
			maxReputation !== null ? `AND a.reputation_ui <= @maxReputation` : '';

		const query = `
			WITH FilteredComments AS (
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
					AND a.reputation_ui >= @minReputation
			)
			SELECT TOP 100 * FROM FilteredComments
			ORDER BY 
				created DESC;
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

function buildCondition(
	column: string,
	values: string | string[],
	sqlRequest: sql.Request,
	paramPrefix: string,
	exclude = false
  ) {
	if (!values || values.length === 0) return '';
  
	const valueArray = Array.isArray(values)
	  ? values.map((value) => value.trim()).filter((value) => value !== '')
	  : values.split(',').map((value) => value.trim()).filter((value) => value !== '');
	if (valueArray.length === 0) return '';
  
	const condition = valueArray
	  .map((_, i) => `${column} ${exclude ? 'NOT LIKE' : 'LIKE'} @${paramPrefix}${i}`)
	  .join(' AND ');
	valueArray.forEach((value, i) => {
	  sqlRequest.input(`${paramPrefix}${i}`, sql.NVarChar, value);
	});
  
	return `AND (${condition})`;
  }

function buildJsonCondition(
	column: string,
	jsonKey: string,
	values: string[],
	sqlRequest: sql.Request,
	paramPrefix: string,
	exclude = false
) {
	if (!values || values.length === 0) return '';

	const placeholders = values.map((_, i) => `@${paramPrefix}${i}`).join(', ');
	values.forEach((value, i) => {
		sqlRequest.input(`${paramPrefix}${i}`, sql.NVarChar, value);
	});

	return exclude
		? `AND NOT EXISTS (
			SELECT 1 
			FROM OPENJSON(${column}, '$."${jsonKey}"') 
			WHERE value IN (${placeholders})
		)`
		: `AND EXISTS (
			SELECT 1
			FROM OPENJSON(${column}, '$."${jsonKey}"')
			WHERE value IN (${placeholders})
		)`;
}