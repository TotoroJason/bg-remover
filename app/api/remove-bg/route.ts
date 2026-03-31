export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

const REMOVE_BG_API_URL = 'https://api.remove.bg/v1.0/removebg';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // 读取原始图片
    const originalArrayBuffer = await imageFile.arrayBuffer();
    const originalBase64 = btoa(
      String.fromCharCode(...new Uint8Array(originalArrayBuffer))
    );

    // 调用 remove.bg API
    const apiFormData = new FormData();
    apiFormData.append('image_file', imageFile);
    apiFormData.append('size', 'auto');
    apiFormData.append('format', 'png');

    const response = await fetch(REMOVE_BG_API_URL, {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.REMOVE_BG_API_KEY || '',
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Remove.bg API error:', errorText);
      throw new Error('Failed to process image');
    }

    const processedArrayBuffer = await response.arrayBuffer();
    const processedBase64 = btoa(
      String.fromCharCode(...new Uint8Array(processedArrayBuffer))
    );

    return NextResponse.json({
      originalImage: `data:image/jpeg;base64,${originalBase64}`,
      processedImage: `data:image/png;base64,${processedBase64}`,
    });
  } catch (error: any) {
    console.error('Error removing background:', error.message);
    return NextResponse.json(
      { error: 'Failed to remove background' },
      { status: 500 }
    );
  }
}
