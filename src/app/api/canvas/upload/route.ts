import { NextResponse } from 'next/server';
import { uploadToR2, getBucketTotalSize } from '@/lib/r2';

const MAX_FILE_SIZE = 7 * 1024 * 1024; // 7MB
const MAX_PROJECT_STORAGE = 1024 * 1024 * 1024; // 1GB

function getImageMimeType(fileName: string, defaultType: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    heic: 'image/heic',
    heif: 'image/heif',
  };
  return map[ext || ''] || defaultType;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy tệp ảnh' }, { status: 400 });
    }

    // Validate file type (must be an image)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Chỉ hỗ trợ tải lên các tệp tin hình ảnh' }, { status: 400 });
    }

    // Validate file size (max 7MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Kích thước tệp tin vượt quá giới hạn cho phép (tối đa 7MB)' }, { status: 400 });
    }

    // Validate total project storage limit (1GB)
    const currentTotalSize = await getBucketTotalSize();
    if (currentTotalSize + file.size > MAX_PROJECT_STORAGE) {
      return NextResponse.json({ error: 'Dung lượng lưu trữ của dự án đã vượt quá giới hạn cho phép (tối đa 1GB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();

    const buffer = Buffer.from(bytes);

    // Make unique filename for party canvas uploads
    const ext = file.name.split('.').pop() || 'png';
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `party-canvas/${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${sanitizedName}`;

    // Create data URL so WebGL texture can load instantly without CORS restrictions
    const base64 = buffer.toString('base64');
    const mime = getImageMimeType(file.name, file.type || 'image/png');
    const dataUrl = `data:${mime};base64,${base64}`;

    // Upload to Cloudflare R2 Bucket
    let publicUrl: string | null = null;
    let uploadSucceeded = false;
    try {
      publicUrl = await uploadToR2(buffer, uniqueFileName, mime);
      uploadSucceeded = true;
    } catch (r2Error: any) {
      console.warn('R2 upload skipped or failed, returning data URL preview fallback:', r2Error?.message);
      publicUrl = dataUrl;
    }

    const proxyUrl = `/api/canvas/view?key=${encodeURIComponent(uniqueFileName)}`;

    return NextResponse.json({
      success: true,
      url: uploadSucceeded ? proxyUrl : dataUrl,
      dataUrl: dataUrl,
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
