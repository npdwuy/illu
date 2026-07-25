import { NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename and make unique
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `uploads/${Date.now()}-${sanitizedOriginalName}`;

    // Upload to Cloudflare R2
    const publicUrl = await uploadToR2(buffer, uniqueFileName, file.type);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueFileName,
    });
  } catch (error: any) {
    console.error('R2 Upload Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload image to Cloudflare R2' },
      { status: 500 }
    );
  }
}
