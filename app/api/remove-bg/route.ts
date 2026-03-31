import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const REMOVE_BG_API_URL = 'https://api.remove.bg/v1.0/removebg';

// 内存存储
const imageStore = new Map<string, { original: Buffer; processed: Buffer | null }>();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // 读取原始图片
    const arrayBuffer = await imageFile.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);
    const imageId = Date.now().toString();

    // 存储原始图片
    imageStore.set(imageId, { original: originalBuffer, processed: null });

    // 调用 remove.bg API
    const apiFormData = new FormData();
    apiFormData.append('image_file', new Blob([originalBuffer]), imageFile.name);
    apiFormData.append('size', 'auto');
    apiFormData.append('format', 'png');

    const response = await axios.post(REMOVE_BG_API_URL, apiFormData, {
      headers: {
        'X-Api-Key': process.env.REMOVE_BG_API_KEY || '',
      },
      responseType: 'arraybuffer',
    });

    const processedBuffer = Buffer.from(response.data);

    // 更新存储的处理后图片
    const stored = imageStore.get(imageId);
    if (stored) {
      stored.processed = processedBuffer;
    }

    return NextResponse.json({
      imageId,
      originalImage: `data:image/jpeg;base64,${originalBuffer.toString('base64')}`,
      processedImage: `data:image/png;base64,${processedBuffer.toString('base64')}`,
    });
  } catch (error: any) {
    console.error('Error removing background:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to remove background' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get('id');
  const type = searchParams.get('type') || 'processed';

  if (!imageId) {
    return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
  }

  const stored = imageStore.get(imageId);
  if (!stored) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }

  const buffer = type === 'original' ? stored.original : stored.processed;
  if (!buffer) {
    return NextResponse.json({ error: 'Processed image not available' }, { status: 404 });
  }

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': type === 'original' ? 'image/jpeg' : 'image/png',
      'Content-Disposition': `attachment; filename="${type}-${imageId}.${type === 'original' ? 'jpg' : 'png'}"`,
    },
  });
}
