import pkg from '@next/env';
import { createClient } from '@libsql/client';

const { loadEnvConfig } = pkg;
loadEnvConfig(process.cwd());

async function checkStickers() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  try {
    const client = createClient({ url, authToken });
    const res = await client.execute('SELECT id, url, uploader_name FROM party_canvas_stickers;');
    console.log(`--- Current Stickers in Database (${res.rows.length} total) ---`);
    for (const row of res.rows) {
      console.log(`ID: ${row.id} | Uploader: ${row.uploader_name} | URL: ${String(row.url).substring(0, 120)}...`);
    }
  } catch (err) {
    console.log('Error querying database:', err.message);
  }
}

checkStickers();
