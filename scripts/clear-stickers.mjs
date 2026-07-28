import pkg from '@next/env';
import { createClient } from '@libsql/client';

const { loadEnvConfig } = pkg;
loadEnvConfig(process.cwd());

async function clearStickers() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error('Turso credentials missing');
    return;
  }

  const client = createClient({ url, authToken });

  try {
    console.log('Clearing party_canvas_stickers database table...');
    await client.execute('DELETE FROM party_canvas_stickers;');
    console.log('✅ Successfully cleared all entries in party_canvas_stickers!');
  } catch (err) {
    console.error('Failed to clear database table:', err.message);
  }
}

clearStickers();
