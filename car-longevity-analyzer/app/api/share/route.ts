/**
 * Share Report API Endpoint
 *
 * POST /api/share
 *
 * Creates a shareable link for an analysis report.
 * Reports are unlisted (noindex) and never expire.
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import type { AnalysisResponse } from '@/lib/api';

interface ShareRequest {
  analysisData: AnalysisResponse;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as ShareRequest;

    if (!body.analysisData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing analysisData in request body',
        },
        { status: 400 }
      );
    }

    const { analysisData } = body;

    // Get optional user ID from auth
    let createdBy: string | null = null;
    try {
      const { userId } = await auth();
      createdBy = userId;
    } catch {
      // Not authenticated - that's fine, reports can be shared anonymously
    }

    // Extract vehicle info for indexing/display
    const vehicleYear = analysisData.vehicle?.year ?? null;
    const vehicleMake = analysisData.vehicle?.make ?? null;
    const vehicleModel = analysisData.vehicle?.model ?? null;
    const verdict = analysisData.recommendation?.verdict ?? null;

    // Create the shared report
    const sharedReport = await prisma.sharedReport.create({
      data: {
        analysisData: analysisData as object,
        vehicleYear,
        vehicleMake,
        vehicleModel,
        verdict,
        createdBy,
      },
    });

    // Build the share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://carlifespancheck.com';
    const shareUrl = `${baseUrl}/report/${sharedReport.id}`;

    return NextResponse.json({
      success: true,
      shareId: sharedReport.id,
      shareUrl,
    });
  } catch (error) {
    console.error('Error creating shared report:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create share link',
      },
      { status: 500 }
    );
  }
}
