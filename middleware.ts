// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

function getAllowedOrigins(): string[] {
  const origins = process.env.ALLOWED_ORIGINS ?? '';
  return origins.split(',').map((o) => o.trim()).filter(Boolean);
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') ?? '';
  const allowedOrigins = getAllowedOrigins();
  const isAllowed = allowedOrigins.includes(origin);

  // Handle preflight request
  if (request.method === 'OPTIONS') {
    const preflightResponse = new NextResponse(null, { status: 204 });
    if (isAllowed) {
      preflightResponse.headers.set('Access-Control-Allow-Origin', origin);
    }
    preflightResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    preflightResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    preflightResponse.headers.set('Access-Control-Max-Age', '86400');
    return preflightResponse;
  }

  const response = NextResponse.next();
  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}

export const config = {
  matcher: '/api/:path*',
};