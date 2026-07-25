import pkg from '@next/env';
import { createClient } from '@libsql/client';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const { loadEnvConfig } = pkg;

// Load environment variables from .env.local without exposing file content
loadEnvConfig(process.cwd());

async function testTurso() {
  console.log('--- Testing Turso DB ---');
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || url.includes('your-db-name')) {
    console.log('❌ Turso: TURSO_DATABASE_URL is not set or still has placeholder value!');
    return false;
  }
  if (!authToken || authToken.includes('your-turso-auth-token')) {
    console.log('❌ Turso: TURSO_AUTH_TOKEN is not set or still has placeholder value!');
    return false;
  }

  try {
    const client = createClient({ url, authToken });
    const res = await client.execute('SELECT 1 as ping;');
    console.log('✅ Turso DB connected successfully! Query ping output:', res.rows[0]);
    return true;
  } catch (err) {
    console.log('❌ Turso DB connection error:', err.message);
    return false;
  }
}

async function testR2() {
  console.log('\n--- Testing Cloudflare R2 Storage ---');
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || 'illu-photos';

  if (!accountId || accountId.includes('your-cloudflare-account-id')) {
    console.log('❌ R2: R2_ACCOUNT_ID is not set or still has placeholder value!');
    return false;
  }
  if (!accessKeyId || accessKeyId.includes('your-r2-access-key-id')) {
    console.log('❌ R2: R2_ACCESS_KEY_ID is not set or still has placeholder value!');
    return false;
  }
  if (!secretAccessKey || secretAccessKey.includes('your-r2-secret-access-key')) {
    console.log('❌ R2: R2_SECRET_ACCESS_KEY is not set or still has placeholder value!');
    return false;
  }

  try {
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1,
    });

    await r2Client.send(command);
    console.log(`✅ Cloudflare R2 Bucket "${bucketName}" connected successfully!`);
    return true;
  } catch (err) {
    console.log('❌ Cloudflare R2 connection error:', err.message);
    return false;
  }
}

async function main() {
  await testTurso();
  await testR2();
}

main();
