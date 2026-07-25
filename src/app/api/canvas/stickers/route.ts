import { NextResponse } from 'next/server';
import { getTursoClient, ensureTablesExist } from '@/lib/turso';
import { deleteFromR2 } from '@/lib/r2';

export async function GET() {
  try {
    await ensureTablesExist();
    const db = getTursoClient();

    const result = await db.execute({
      sql: `SELECT * FROM party_canvas_stickers ORDER BY z_index ASC, created_at ASC`,
      args: [],
    });

    const stickers = result.rows.map((row) => ({
      id: String(row.id),
      url: String(row.url),
      x: Number(row.x),
      y: Number(row.y),
      width: Number(row.width),
      height: Number(row.height),
      description: row.description ? String(row.description) : '',
      elevation: Number(row.elevation ?? 10),
      sheenMode: String(row.sheen_mode ?? 'sheen'),
      lightingColor: String(row.lighting_color ?? '#ffffff'),
      zIndex: Number(row.z_index ?? 1000),
      created_at: row.created_at ? String(row.created_at) : null,
    }));

    return NextResponse.json({ success: true, stickers });
  } catch (error: any) {
    console.error('Fetch Canvas Stickers Error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Lỗi kết nối database' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureTablesExist();
    const db = getTursoClient();
    const body = await request.json();

    // Supports single sticker or array batch upsert
    const items = Array.isArray(body.stickers) ? body.stickers : [body];

    for (const item of items) {
      if (!item.id || !item.url) continue;

      await db.execute({
        sql: `INSERT INTO party_canvas_stickers (
          id, url, x, y, width, height, description, elevation, sheen_mode, lighting_color, z_index, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          url = excluded.url,
          x = excluded.x,
          y = excluded.y,
          width = excluded.width,
          height = excluded.height,
          description = excluded.description,
          elevation = excluded.elevation,
          sheen_mode = excluded.sheen_mode,
          lighting_color = excluded.lighting_color,
          z_index = excluded.z_index,
          updated_at = datetime('now')`,
        args: [
          item.id,
          item.url,
          item.x ?? 0,
          item.y ?? 0,
          item.width ?? 400,
          item.height ?? 300,
          item.description ?? '',
          item.elevation ?? 10,
          item.sheenMode ?? 'sheen',
          item.lightingColor ?? '#ffffff',
          item.zIndex ?? 1000,
        ],
      });
    }

    return NextResponse.json({ success: true, message: 'Đã lưu trạng thái Canvas vào Database' });
  } catch (error: any) {
    console.error('Save Canvas Stickers Error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Không thể lưu vào database' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureTablesExist();
    const db = getTursoClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID sticker' }, { status: 400 });
    }

    // Retrieve row first to get R2 URL if we want to delete from bucket
    const result = await db.execute({
      sql: `SELECT url FROM party_canvas_stickers WHERE id = ?`,
      args: [id],
    });

    if (result.rows.length > 0) {
      const url = String(result.rows[0].url);
      if (url.includes('party-canvas/')) {
        const key = 'party-canvas/' + url.split('party-canvas/')[1];
        try {
          await deleteFromR2(key);
        } catch (e) {
          console.warn('Could not delete from R2 bucket:', e);
        }
      }
    }

    await db.execute({
      sql: `DELETE FROM party_canvas_stickers WHERE id = ?`,
      args: [id],
    });

    return NextResponse.json({ success: true, message: 'Đã xóa sticker' });
  } catch (error: any) {
    console.error('Delete Sticker Error:', error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
