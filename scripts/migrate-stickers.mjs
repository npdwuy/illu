import pkg from '@next/env';
import { createClient } from '@libsql/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const { loadEnvConfig } = pkg;
loadEnvConfig(process.cwd());

const accountId = process.env.R2_ACCOUNT_ID || '';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
const bucketName = process.env.R2_BUCKET_NAME || 'illu-photos';
const publicUrl = process.env.R2_PUBLIC_URL || '';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function uploadToR2(fileBuffer, fileName, contentType) {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Cloudflare R2 credentials are missing');
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: fileBuffer,
    ContentType: contentType,
  });

  await r2Client.send(command);
  const baseUrl = publicUrl.replace(/\/$/, '');
  return `${baseUrl}/${fileName}`;
}

async function migrate() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error('Turso credentials missing');
    return;
  }

  const client = createClient({ url, authToken });

  try {
    const res = await client.execute('SELECT id, url, uploader_name FROM party_canvas_stickers;');
    console.log(`Found ${res.rows.length} stickers. Starting migration of Base64 images to R2...`);

    let migratedCount = 0;

    for (const row of res.rows) {
      const stickerId = row.id;
      const stickerUrl = String(row.url);

      if (stickerUrl.startsWith('data:image/')) {
        console.log(`Migrating sticker ID: ${stickerId} (Uploader: ${row.uploader_name})...`);

        // Parse base64
        const matches = stickerUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-+.]+);base64,(.+)$/);
        if (!matches) {
          console.log(`⚠️ Failed to parse base64 for sticker ID: ${stickerId}`);
          continue;
        }

        const contentType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate filename
        const ext = contentType.split('/')[1] || 'png';
        const uniqueFileName = `party-canvas/migrated-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

        try {
          const r2PublicUrl = await uploadToR2(buffer, uniqueFileName, contentType);
          console.log(`Uploaded to R2: ${r2PublicUrl}`);

          const proxyUrl = `/api/canvas/view?key=${encodeURIComponent(uniqueFileName)}`;

          // Update DB
          await client.execute({
            sql: 'UPDATE party_canvas_stickers SET url = ? WHERE id = ?',
            args: [proxyUrl, stickerId],
          });

          console.log(`✅ Updated sticker ID: ${stickerId} with Proxy URL: ${proxyUrl}`);
          migratedCount++;
        } catch (uploadErr) {
          console.error(`❌ Failed to upload sticker ID: ${stickerId} to R2:`, uploadErr.message);
        }
      } else {
        console.log(`Skipping sticker ID: ${stickerId} (already non-base64 url: ${stickerUrl.substring(0, 50)}...)`);
      }
    }

    console.log(`\nMigration completed! Migrated ${migratedCount} stickers.`);
  } catch (err) {
    console.error('Migration error:', err.message);
  }
}

migrate();
