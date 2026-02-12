import { NextResponse } from 'next/server';
import { generateRSSFeed } from '../lib/rss';

export async function GET() {
  try {
    const xml = await generateRSSFeed();
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('[nextblogkit] RSS generation error:', error);
    return new NextResponse('RSS generation failed', { status: 500 });
  }
}
