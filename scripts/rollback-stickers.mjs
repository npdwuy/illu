import pkg from '@next/env';
import { createClient } from '@libsql/client';

const { loadEnvConfig } = pkg;
loadEnvConfig(process.cwd());

async function rollback() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error('Turso credentials missing');
    return;
  }

  const client = createClient({ url, authToken });

  try {
    const res = await client.execute('SELECT id, url, uploader_name FROM party_canvas_stickers;');
    console.log(`Found ${res.rows.length} stickers. Starting rollback to Base64...`);

    let rolledBackCount = 0;

    for (const row of res.rows) {
      const stickerId = row.id;
      const stickerUrl = String(row.url);

      if (stickerUrl.startsWith('http') && stickerUrl.includes('party-canvas/')) {
        console.log(`Rolling back sticker ID: ${stickerId} (Uploader: ${row.uploader_name})...`);

        try {
          const fetchRes = await fetch(stickerUrl);
          if (!fetchRes.ok) {
            console.error(`❌ Failed to fetch image from R2: ${stickerUrl}`);
            continue;
          }

          const arrayBuffer = await fetchRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const contentType = fetchRes.headers.get('content-type') || 'image/png';
          
          const base64Data = buffer.toString('base64');
          const base64Url = `data:${contentType};base64,${base64Data}`;

          // Update DB
          await client.execute({
            sql: 'UPDATE party_canvas_stickers SET url = ? WHERE id = ?',
            args: [base64Url, stickerId],
          });

          console.log(`✅ Restored sticker ID: ${stickerId} to Base64.`);
          rolledBackCount++;
        } catch (fetchErr) {
          console.error(`❌ Error fetching/restoring sticker ID: ${stickerId}:`, fetchErr.message);
        }
      } else {
        console.log(`Skipping sticker ID: ${stickerId} (already base64 or other URL)`);
      }
    }

    console.log(`\nRollback completed! Restored ${rolledBackCount} stickers to Base64.`);
  } catch (err) {
    console.error('Rollback error:', err.message);
  }
}

rollback();
