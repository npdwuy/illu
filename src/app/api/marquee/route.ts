import { NextResponse } from 'next/server';
import { getTursoClient, ensureTablesExist } from '@/lib/turso';
import { deleteFromR2 } from '@/lib/r2';

// ── Types ──────────────────────────────────────────────────────────────────
interface MarqueeImageRow {
  id: string;
  url: string;
  r2_key: string | null;
  title: string;
  date: string;
  location: string;
  category: string;
  tags: string;         // JSON array string
  description: string;
  aspect_ratio: string;
  row_index: number;
  sort_order: number;
}

// ── GET: fetch all marquee images grouped by row ───────────────────────────
export async function GET() {
  try {
    await ensureTablesExist();
    const db = getTursoClient();

    const result = await db.execute(
      'SELECT id, url, r2_key, title, date, location, category, tags, description, aspect_ratio, row_index, sort_order FROM marquee_images ORDER BY row_index ASC, sort_order ASC'
    );

    // Group by row_index and parse tags JSON
    const rowsMap = new Map<number, object[]>();
    for (const row of result.rows as unknown as MarqueeImageRow[]) {
      const idx = Number(row.row_index);
      if (!rowsMap.has(idx)) rowsMap.set(idx, []);
      let tags: string[] = [];
      try { tags = JSON.parse(String(row.tags || '[]')); } catch { tags = []; }

      rowsMap.get(idx)!.push({
        id: String(row.id),
        url: String(row.url),
        r2Key: row.r2_key ? String(row.r2_key) : null,
        title: String(row.title),
        date: String(row.date || ''),
        location: String(row.location || ''),
        category: String(row.category || ''),
        tags,
        description: String(row.description || ''),
        aspectRatio: String(row.aspect_ratio || '4/3'),
        rowIndex: idx,
        sortOrder: Number(row.sort_order),
      });
    }

    // Convert map to sorted array of arrays
    const maxRow = rowsMap.size > 0 ? Math.max(...rowsMap.keys()) : -1;
    const rows: object[][] = [];
    for (let i = 0; i <= maxRow; i++) {
      rows.push(rowsMap.get(i) || []);
    }

    return NextResponse.json({ rows });
  } catch (error) {
    console.error('[marquee] GET error:', error);
    return NextResponse.json({ rows: [] });
  }
}

// ── POST: add a new image ─────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    await ensureTablesExist();
    const db = getTursoClient();
    const body = await request.json();

    const { id, url, r2Key, title, date, location, category, tags, description, aspectRatio, rowIndex } = body;

    // Determine sort_order = max existing + 1 for that row
    const countRes = await db.execute({
      sql: 'SELECT COUNT(*) as cnt FROM marquee_images WHERE row_index = ?',
      args: [rowIndex ?? 0],
    });
    const sortOrder = Number((countRes.rows[0] as unknown as { cnt: number }).cnt);

    await db.execute({
      sql: `INSERT INTO marquee_images (id, url, r2_key, title, date, location, category, tags, description, aspect_ratio, row_index, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        url,
        r2Key ?? null,
        title || 'Untitled',
        date || '',
        location || '',
        category || '',
        JSON.stringify(tags || []),
        description || '',
        aspectRatio || '4/3',
        rowIndex ?? 0,
        sortOrder,
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[marquee] POST error:', error);
    return NextResponse.json({ error: 'Failed to add image' }, { status: 500 });
  }
}

// ── PUT: update image metadata ────────────────────────────────────────────
export async function PUT(request: Request) {
  try {
    await ensureTablesExist();
    const db = getTursoClient();
    const body = await request.json();

    if (body.type === 'REORDER') {
      // Bulk update sort_order for a row
      // body.items = [{ id, sortOrder }]
      const { items } = body as { items: { id: string; sortOrder: number }[] };
      for (const item of items) {
        await db.execute({
          sql: 'UPDATE marquee_images SET sort_order = ?, updated_at = datetime(\'now\') WHERE id = ?',
          args: [item.sortOrder, item.id],
        });
      }
    } else {
      // Regular metadata update
      const { id, title, date, location, category, tags, description, aspectRatio, rowIndex } = body;
      await db.execute({
        sql: `UPDATE marquee_images SET title=?, date=?, location=?, category=?, tags=?, description=?, aspect_ratio=?, row_index=?, updated_at=datetime('now') WHERE id=?`,
        args: [
          title || 'Untitled',
          date || '',
          location || '',
          category || '',
          JSON.stringify(tags || []),
          description || '',
          aspectRatio || '4/3',
          rowIndex ?? 0,
          id,
        ],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[marquee] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update image' }, { status: 500 });
  }
}

// ── DELETE: remove image + R2 object ─────────────────────────────────────
export async function DELETE(request: Request) {
  try {
    await ensureTablesExist();
    const db = getTursoClient();
    const body = await request.json();

    if ('rowIndex' in body) {
      const { rowIndex } = body as { rowIndex: number };

      // 1. Fetch R2 keys for all images in this row to delete from R2
      const res = await db.execute({
        sql: 'SELECT r2_key FROM marquee_images WHERE row_index = ?',
        args: [rowIndex],
      });

      for (const row of res.rows) {
        const r2Key = (row as unknown as { r2_key: string | null }).r2_key;
        if (r2Key) {
          try { await deleteFromR2(r2Key); } catch (e) { console.warn('[marquee] R2 delete failed:', e); }
        }
      }

      // 2. Delete all records of this row
      await db.execute({
        sql: 'DELETE FROM marquee_images WHERE row_index = ?',
        args: [rowIndex],
      });

      // 3. Shift row_index of subsequent rows down by 1
      await db.execute({
        sql: 'UPDATE marquee_images SET row_index = row_index - 1 WHERE row_index > ?',
        args: [rowIndex],
      });

      return NextResponse.json({ success: true });
    } else {
      const { id } = body as { id: string };

      // Fetch r2_key before deletion to clean up storage
      const res = await db.execute({
        sql: 'SELECT r2_key FROM marquee_images WHERE id = ?',
        args: [id],
      });

      if (res.rows.length > 0) {
        const r2Key = (res.rows[0] as unknown as { r2_key: string | null }).r2_key;
        if (r2Key) {
          try { await deleteFromR2(r2Key); } catch (e) { console.warn('[marquee] R2 delete failed:', e); }
        }
      }

      await db.execute({ sql: 'DELETE FROM marquee_images WHERE id = ?', args: [id] });

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('[marquee] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
