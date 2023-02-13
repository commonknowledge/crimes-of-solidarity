import AWS from 'aws-sdk'
import env from 'env-var';
import {
  SolidarityAction,
  SolidarityActionAirtableRecord,
  AirtableCDNMap
} from './types';
import {
  ensureArray
} from '../utils/string';
import {
  solidarityActionBase
} from './solidarityAction';
import {
  chunk
} from 'lodash';

export async function syncSolidarityActionsToCDN(_action: SolidarityAction | SolidarityAction[]) {
  const actions = ensureArray(_action)
  const updateList: Array<{
    id: string,
    fields: Partial<SolidarityActionAirtableRecord['fields']>
  }> = []
  for (const action of actions) {
    if (action.fields.Document?.length) {
      // Synchronise Docs and CDN Map column
      const missingCDNMapEntry = action.fields.Document!.some(doc => !action.cdnMap.find(cdn => cdn.airtableDocID === doc.id))
      const invalidCDNMapEntry = action.cdnMap.some(cdn => !action.fields.Document!.find(doc => doc.id === cdn.airtableDocID))
      if (missingCDNMapEntry || invalidCDNMapEntry) {
        // There's a mismatch between the docs and the CDN map, so we need to re-sync
        // First upload the docs to the CDN
        const cdnPayload = await uploadSolidarityActionAttachmentsToCDN(action)
        // Then sync the public URLs back to Airtable
        if (cdnPayload.length > 0) {
          updateList.push({
            id: action.id,
            fields: {
              cdn_urls: JSON.stringify(cdnPayload)
            }
          })
        }
      }
    } else if (action.fields.cdn_urls) {
      // Clear CDNs to reflect the fact there are no docs
      updateList.push({
        id: action.id,
        fields: {
          cdn_urls: "[]"
        }
      })
    }
  }
  let recordsUpdated = 0
  for (const chunkedUpdate of chunk(updateList, 10)) {
    recordsUpdated += (await updateSolidarityActions(chunkedUpdate)).length
  }
  return recordsUpdated
}

async function uploadSolidarityActionAttachmentsToCDN(action: SolidarityAction) {
  const cdnMap: AirtableCDNMap[] = []
  for (const doc of (action.fields?.Document || [])) {
    try {
      const thumbnailExtension = 'jpg'
      const [original, thumbnail] = await Promise.all([
        uploadToCDN(doc.url, `${doc.id}-${doc.filename}`),
        uploadToCDN(doc.thumbnails.large.url, `${doc.id}-${doc.filename}-thumbnail.${thumbnailExtension}`)
      ])
      if (!!original && !!thumbnail) {
        cdnMap.push({
          filename: doc.filename,
          filetype: doc.type,
          airtableDocID: doc.id,
          downloadURL: original.Location,
          thumbnailURL: thumbnail.Location,
          thumbnailWidth: doc.thumbnails.large.width,
          thumbnailHeight: doc.thumbnails.large.height,
        })
      }
    } catch (e) {
      console.error(`Failed to upload ${doc.url} to CDN`, e)
    }
  }
  return cdnMap
}

export async function uploadToCDN(url: string, filename: string) {
  return uploadToS3(url, filename)
}

export async function uploadToS3(url: string, filename: string) {
  const s3 = new AWS.S3({
    accessKeyId: env.get("AWS_S3_ACCESS_KEY_ID").required().asString(),
    secretAccessKey: env.get("AWS_S3_SECRET_ACCESS_KEY").required().asString(),
  })

  // Download the file from the URL
  const res = await fetch(url)
  const blob = new Uint8Array(await res.arrayBuffer())
  console.log("Uploading", filename)

  return s3.upload({
    Bucket: env.get("AWS_S3_BUCKET_NAME").required().asString(),
    Key: filename,
    Body: blob,
  }).promise()
}

async function updateSolidarityActions(updates: any[]) {
  return new Promise<SolidarityActionAirtableRecord[]>((resolve, reject) => {
    solidarityActionBase().update(updates, function (err, records) {
      if (err) {
        reject(err)
      }
      resolve(records)
    });
  })
}