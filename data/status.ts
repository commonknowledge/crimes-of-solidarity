import { Status } from './types';
import { airtableBase } from './airtable';
import env from 'env-var';
import { statusSchema } from './schema';
import { QueryParams } from 'airtable/lib/query_params';
import { getLiveSolidarityActionsByStatusId } from './solidarityAction';
import { parseMarkdown } from './markdown';

export const formatStatus = (status: Status) => {
    status.fields.Name.trim()

    status.summary = parseMarkdown(status.fields.Summary || '')

    try {
        // Remove any keys not expected by the parser
        status = statusSchema.parse(status)
    } catch (e) {
        console.error(JSON.stringify(status), e)
    }
    return status
}

const fields: Array<keyof Status['fields']> = ['Name', 'Summary', 'Solidarity Actions']

export const statusBase = () => airtableBase()<Status['fields']>(
    env.get('AIRTABLE_TABLE_NAME_CATEGORIES').default('StatusOfAccused').asString()
)

export async function getStatuses(selectArgs: QueryParams<Status['fields']> = {}): Promise<Array<Status>> {
    return new Promise((resolve, reject) => {
        const statuses: Status[] = []

        function finish() {
            try {
                resolve(
                    statuses.filter(a =>
                        statusSchema.safeParse(a).success === true
                    )
                )
            } catch (e) {
                reject(e)
            }
        }

        statusBase().select({
            sort: [
                { field: "Name", direction: "asc", },
            ],
            fields: fields,
            maxRecords: 1000,
            // view: env.get('AIRTABLE_TABLE_VIEW_CATEGORIES').default('Grid view').asString(),
            filterByFormula: 'COUNTA({Solidarity Actions}) > 0',
            ...selectArgs
        }).eachPage(function page(records, fetchNextPage) {
            try {
                records.forEach(function (record) {
                    statuses.push(formatStatus(record._rawJson))
                });
                fetchNextPage();
            } catch (e) {
                finish()
            }
        }, function done(err) {
            if (err) { reject(err); return; }
            finish()
        });
    })
}

export async function getStatusBy(selectArgs: QueryParams<Status['fields']> = {}, description?: string) {
    return new Promise<Status>((resolve, reject) => {
        statusBase().select({
            // sort: [
            //   { field: "Name", direction: "asc", },
            // ],
            fields: fields,
            maxRecords: 1,
            // view: env.get('AIRTABLE_TABLE_VIEW_CATEGORIES').default('Grid view').asString(),
            ...selectArgs
        }).firstPage(function page(error, records) {
            try {
                if (error) console.error(error)
                if (error || !records?.length) {
                    return reject(`No statuses was found for filter ${JSON.stringify(selectArgs)}`)
                }
                const status = records?.[0]._rawJson
                resolve(formatStatus(status))
            } catch (e) {
                reject(e)
            }
        })
    })
}

export async function getStatusByName(name: string) {
    return getStatusBy({
        filterByFormula: `{Name}="${name}"`
    })
}

export type StatusData = {
    status: Status
}

export const getStatusDataByCode = async (name: string): Promise<StatusData> => {
    const status = await getStatusByName(name)
    if (!status) {
        throw new Error("No such status was found for this status code.")
    }

    const solidarityActions = await getLiveSolidarityActionsByStatusId(status.id)

    return {
        status: {
            ...status,
            solidarityActions
        }
    }
}