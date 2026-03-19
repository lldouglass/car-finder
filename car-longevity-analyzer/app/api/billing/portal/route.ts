import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Buyer Pass is a one-time purchase and has no recurring subscription to manage.',
    },
    { status: 410 }
  );
}
