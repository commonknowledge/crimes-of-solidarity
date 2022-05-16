import { Type } from './types';
import { airtableBase } from './airtable';
import env from 'env-var';
import { typeSchema } from './schema';
import { QueryParams } from 'airtable/lib/query_params';
import { getLiveSolidarityActionsByTypeId } from './solidarityAction';
import { parseMarkdown } from './markdown';

export const formatType = (type: Type) => {
  type.fields.Name.trim()

  type.summary = parseMarkdown(type.fields.Summary || '')

  try {
    // Remove any keys not expected by the parser
    type = typeSchema.parse(type)
  } catch (e) {
    console.error(JSON.stringify(type), e)
  }
  return type
}

const fields: Array<keyof Type['fields']> = ['Name', 'Summary', 'Solidarity Actions']

export const typeBase = () => airtableBase()<Type['fields']>(
  env.get('AIRTABLE_TABLE_NAME_CATEGORIES').default('Types').asString()
)

export async function getTypes(selectArgs: QueryParams<Type['fields']> = {}): Promise<Array<Type>> {
  return new Promise((resolve, reject) => {
    const types: Type[] = []

    function finish() {
      try {
        resolve(
          types.filter(a =>
            typeSchema.safeParse(a).success === true
          )
        )
      } catch (e) {
        reject(e)
      }
    }

    typeBase().select({
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
          types.push(formatType(record._rawJson))
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

export async function getTypeBy(selectArgs: QueryParams<Type['fields']> = {}, description?: string) {
  return new Promise<Type>((resolve, reject) => {
    typeBase().select({
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
          return reject(`No types was found for filter ${JSON.stringify(selectArgs)}`)
        }
        const type = records?.[0]._rawJson
        resolve(formatType(type))
      } catch (e) {
        reject(e)
      }
    })
  })
}

export async function getTypeByName(name: string) {
  return getTypeBy({
    filterByFormula: `{Name}="${name}"`
  })
}

export type TypeData = {
  type: Type
}

export const getTypeDataByCode = async (name: string): Promise<TypeData> => {
  const type = await getTypeByName(name)
  if (!type) {
    throw new Error("No such type was found for this type code.")
  }

  const solidarityActions = await getLiveSolidarityActionsByTypeId(type.id)

  return {
    type: {
      ...type,
      solidarityActions
    }
  }
}