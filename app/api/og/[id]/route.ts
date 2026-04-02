import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Simple OG image placeholder - returns SVG
  const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1B4965"/>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#grad)"/>
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1B4965"/>
          <stop offset="100%" style="stop-color:#2d7da8"/>
        </linearGradient>
      </defs>
      <text x="600" y="200" text-anchor="middle" fill="#FFB703" font-size="72" font-weight="bold" font-family="sans-serif">Weekendaa</text>
      <text x="600" y="280" text-anchor="middle" fill="white" font-size="36" font-family="sans-serif">My Chennai Weekend Plan</text>
      <text x="600" y="360" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="28" font-family="sans-serif">Traffic-optimized weekend planner</text>
      <text x="600" y="500" text-anchor="middle" fill="#FFB703" font-size="24" font-family="sans-serif">Plan smart. Dodge traffic. Enjoy Chennai.</text>
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
