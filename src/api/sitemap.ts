import { NextResponse } from 'next/server';
import { generateSitemap } from '../lib/sitemap';

export async function GET() {
  try {
    const xml = await generateSitemap();
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('[nextblogkit] Sitemap generation error:', error);
    return new NextResponse('Sitemap generation failed', { status: 500 });
  }
}
