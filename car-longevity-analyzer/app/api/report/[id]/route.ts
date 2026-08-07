/**
 * Fetch Shared Report API Endpoint
 *
 * GET /api/report/[id]
 *
 * Fetches a shared report by ID and increments view count.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { gatePremiumAnalysis } from '@/lib/premium-gate';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing report ID',
        },
        { status: 400 }
      );
    }

    // Fetch the report and increment view count atomically
    const sharedReport = await prisma.sharedReport.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    if (!sharedReport) {
      return NextResponse.json(
        {
          success: false,
          error: 'Report not found',
        },
        { status: 404 }
      );
    }

    // Shared links are public and unauthenticated, so paid analysis is stripped
    // on read as well as on write — rows stored before sanitization existed may
    // still contain premium fields.
    const analysisData =
      sharedReport.analysisData && typeof sharedReport.analysisData === 'object'
        ? gatePremiumAnalysis(sharedReport.analysisData as Record<string, unknown>, false)
        : sharedReport.analysisData;

    return NextResponse.json({
      success: true,
      analysisData,
      createdAt: sharedReport.createdAt.toISOString(),
      viewCount: sharedReport.viewCount,
    });
  } catch (error) {
    // Handle Prisma's record not found error
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Report not found',
        },
        { status: 404 }
      );
    }

    console.error('Error fetching shared report:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch report',
      },
      { status: 500 }
    );
  }
}
