import { SolidarityActionAirtableRecord } from './types';

const lowercaseAlphanumericSlugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function validateAirtableAction (action: SolidarityActionAirtableRecord): boolean {
  return !!action.fields.slug?.match(lowercaseAlphanumericSlugRegex)
}