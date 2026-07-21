import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data.json');

interface RecapImage {
  id: string;
  url: string;
  caption: string;
  likes: number;
  time: string;
}

interface Wish {
  id: string;
  name: string;
  role: string;
  content: string;
  date: string;
}

interface TimelineComment {
  id: string;
  year: number;
  name: string;
  content: string;
  imageUrl?: string;
  date: string;
}

interface DataSchema {
  images: RecapImage[];
  wishes: Wish[];
  comments: TimelineComment[];
}

function readData(): DataSchema {
  if (!fs.existsSync(DATA_FILE)) {
    const initialData: DataSchema = { images: [], wishes: [], comments: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  try {
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return { images: [], wishes: [], comments: [] };
  }
}

function writeData(data: DataSchema) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  const data = readData();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = readData();

    if (body.type === 'IMAGE') {
      data.images.push(body.data);
    } else if (body.type === 'LIKE_IMAGE') {
      const img = data.images.find((i) => i.id === body.id);
      if (img) {
        img.likes = (img.likes || 0) + 1;
      }
    } else if (body.type === 'DELETE_IMAGE') {
      data.images = data.images.filter((i) => i.id !== body.id);
    } else if (body.type === 'WISH') {
      data.wishes.push(body.data);
    } else if (body.type === 'TIMELINE_COMMENT') {
      data.comments.push(body.data);
    }

    writeData(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
