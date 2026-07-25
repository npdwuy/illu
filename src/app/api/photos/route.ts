import { NextResponse } from 'next/server';
import { getTursoClient, ensureTablesExist } from '@/lib/turso';

export async function GET() {
  try {
    await ensureTablesExist();
    const db = getTursoClient();

    const [imagesResult, wishesResult, commentsResult] = await Promise.all([
      db.execute('SELECT id, url, caption, likes, time FROM images ORDER BY created_at ASC'),
      db.execute('SELECT id, name, role, content, date FROM wishes ORDER BY created_at ASC'),
      db.execute('SELECT id, year, name, content, image_url AS imageUrl, date FROM comments ORDER BY created_at ASC'),
    ]);

    const images = imagesResult.rows.map((row) => ({
      id: String(row.id),
      url: String(row.url),
      caption: String(row.caption || ''),
      likes: Number(row.likes || 0),
      time: String(row.time || ''),
    }));

    const wishes = wishesResult.rows.map((row) => ({
      id: String(row.id),
      name: String(row.name || ''),
      role: String(row.role || ''),
      content: String(row.content || ''),
      date: String(row.date || ''),
    }));

    const comments = commentsResult.rows.map((row) => ({
      id: String(row.id),
      year: Number(row.year || 0),
      name: String(row.name || ''),
      content: String(row.content || ''),
      imageUrl: row.imageUrl ? String(row.imageUrl) : undefined,
      date: String(row.date || ''),
    }));

    return NextResponse.json({ images, wishes, comments });
  } catch (error) {
    console.error('Turso DB GET Error:', error);
    // Return empty state gracefully if DB connection is pending setup
    return NextResponse.json({ images: [], wishes: [], comments: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await ensureTablesExist();
    const db = getTursoClient();

    if (body.type === 'IMAGE') {
      const { id, url, caption, likes, time } = body.data;
      await db.execute({
        sql: 'INSERT INTO images (id, url, caption, likes, time) VALUES (?, ?, ?, ?, ?)',
        args: [id, url, caption || '', likes || 0, time || ''],
      });
    } else if (body.type === 'LIKE_IMAGE') {
      await db.execute({
        sql: 'UPDATE images SET likes = likes + 1 WHERE id = ?',
        args: [body.id],
      });
    } else if (body.type === 'DELETE_IMAGE') {
      await db.execute({
        sql: 'DELETE FROM images WHERE id = ?',
        args: [body.id],
      });
    } else if (body.type === 'WISH') {
      const { id, name, role, content, date } = body.data;
      await db.execute({
        sql: 'INSERT INTO wishes (id, name, role, content, date) VALUES (?, ?, ?, ?, ?)',
        args: [id, name, role || '', content || '', date || ''],
      });
    } else if (body.type === 'TIMELINE_COMMENT') {
      const { id, year, name, content, imageUrl, date } = body.data;
      await db.execute({
        sql: 'INSERT INTO comments (id, year, name, content, image_url, date) VALUES (?, ?, ?, ?, ?, ?)',
        args: [id, year, name || '', content || '', imageUrl || null, date || ''],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Turso DB POST Error:', error);
    return NextResponse.json({ error: 'Failed to process database operation' }, { status: 500 });
  }
}
