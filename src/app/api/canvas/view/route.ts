import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '@/lib/r2';

const bucketName = process.env.R2_BUCKET_NAME || 'illu-photos';

async function streamToUint8Array(stream: any): Promise<Uint8Array> {
  if (!stream) return new Uint8Array(0);
  
  if (typeof stream.transformToByteArray === "function") {
    return await stream.transformToByteArray();
  }
  
  if (typeof stream.getReader === "function") {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let totalLength = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalLength += value.length;
    }
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }
  
  if (Symbol.asyncIterator in stream) {
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    return new Uint8Array(Buffer.concat(chunks));
  }
  
  if (typeof stream.on === "function") {
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      stream.on("data", (chunk: any) => chunks.push(chunk));
      stream.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks))));
      stream.on("error", reject);
    });
  }

  throw new Error("Unsupported stream type");
}

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return new Response('Missing key parameter', { status: 400 });
    }

    // Security check: Only allow keys in party-canvas or uploads directories
    if (!key.startsWith('party-canvas/') && !key.startsWith('uploads/')) {
      return new Response('Access Denied', { status: 403 });
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await r2Client.send(command);
    
    if (!response.Body) {
      return new Response('Not Found', { status: 404 });
    }

    let contentType = response.ContentType || 'image/png';
    if (!contentType.startsWith('image/')) {
      contentType = getImageMimeType(key, contentType);
    }
    
    const data = await streamToUint8Array(response.Body);

    return new Response(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('R2 Proxy GET Error:', error);
    return new Response('Error loading asset', { status: 500 });
  }
}
