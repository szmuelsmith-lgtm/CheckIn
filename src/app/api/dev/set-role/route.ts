import { NextResponse } from 'next/server';

// Disabled in production — this endpoint existed for local dev role switching only.
export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ error: 'Dev endpoint disabled' }, { status: 403 });
}
