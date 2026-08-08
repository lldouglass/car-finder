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
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { SHARE_RATE_LIMIT } from '@/lib/constants';
import {
  sanitizeSharedAnalysis,
  ShareValidationError,
  MAX_SHARE_PAYLOAD_BYTES,
} from '@/lib/share-payload';

interface ShareRequest {
  analysisData: AnalysisResponse;
}

export async function POST(request: Request) {
  try {
    // Anonymous sharing stays open, but capped so it cannot be used to bulk
    // write rows into the database or publish content on our domain.
    const rateLimit = await checkRateLimit(
      `share:${getClientIdentifier(request)}`,
      SHARE_RATE_LIMIT.maxRequests,
      SHARE_RATE_LIMIT.windowMs
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many share links created. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.retryAfterMs ?? 60_000) / 1000)) } }
      );
    }

    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_SHARE_PAYLOAD_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Report is too large to share' },
        { status: 413 }
      );
    }

    let body: ShareRequest;
    try {
      body = JSON.parse(rawBody) as ShareRequest;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    if (!body.analysisData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing analysisData in request body',
        },
        { status: 400 }
      );
    }

    // Drop unknown keys and paid fields: a shared link always shows the free report
    let analysisData: Record<string, unknown>;
    try {
      analysisData = sanitizeSharedAnalysis(body.analysisData);
    } catch (error) {
      if (error instanceof ShareValidationError) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      throw error;
    }

    // Get optional user ID from auth
    let createdBy: string | null = null;
    try {
      const { userId } = await auth();
      createdBy = userId;
    } catch {
      // Not authenticated - that's fine, reports can be shared anonymously
    }

    // Extract vehicle info for indexing/display
    const vehicle = analysisData.vehicle as AnalysisResponse['vehicle'] | undefined;
    const recommendation = analysisData.recommendation as AnalysisResponse['recommendation'] | undefined;
    const vehicleYear = vehicle?.year ?? null;
    const vehicleMake = vehicle?.make ?? null;
    const vehicleModel = vehicle?.model ?? null;
    const verdict = recommendation?.verdict ?? null;

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
