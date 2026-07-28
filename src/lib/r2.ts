import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID || '';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
const bucketName = process.env.R2_BUCKET_NAME || 'illu-photos';
const publicUrl = process.env.R2_PUBLIC_URL || '';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function getBucketTotalSize(): Promise<number> {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    return 0; // Return 0 if R2 is not configured
  }

  let totalSize = 0;
  let isTruncated = true;
  let continuationToken: string | undefined = undefined;

  while (isTruncated) {
    const command: ListObjectsV2Command = new ListObjectsV2Command({
      Bucket: bucketName,
      ContinuationToken: continuationToken,
    });
    const response = await r2Client.send(command);
    if (response.Contents) {
      for (const item of response.Contents) {
        totalSize += item.Size || 0;
      }
    }
    isTruncated = response.IsTruncated || false;
    continuationToken = response.NextContinuationToken;
  }
  return totalSize;
}


export async function uploadToR2(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Cloudflare R2 credentials are missing in .env.local');
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: fileBuffer,
    ContentType: contentType,
  });

  await r2Client.send(command);

  // Return full public URL of the uploaded image
  const baseUrl = publicUrl.replace(/\/$/, '');
  return `${baseUrl}/${fileName}`;
}

export async function deleteFromR2(fileName: string): Promise<void> {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    return;
  }

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: fileName,
  });

  await r2Client.send(command);
}
