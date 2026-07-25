import { NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy tệp ảnh' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Make unique filename for party canvas uploads
    const ext = file.name.split('.').pop() || 'png';
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `party-canvas/${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${sanitizedName}`;

    // Create data URL so WebGL texture can load instantly without CORS restrictions
    const base64 = buffer.toString('base64');
    const mime = file.type || 'image/png';
    const dataUrl = `data:${mime};base64,${base64}`;

    // Upload to Cloudflare R2 Bucket
    let publicUrl: string = dataUrl;
    try {
      publicUrl = await uploadToR2(buffer, uniqueFileName, file.type || 'image/png');
    } catch (r2Error: any) {
      console.warn('R2 upload skipped or failed, returning data URL preview fallback:', r2Error?.message);
    }

    return NextResponse.json({
      success: true,
      url: dataUrl,
      r2Url: publicUrl,
      fileName: uniqueFileName,
    });
  } catch (error: any) {
    console.error('Canvas Image Upload Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi khi tải ảnh lên Bucket' },
      { status: 500 }
    );
  }
}
