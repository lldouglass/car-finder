import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { SharedReportView } from '@/components/shared-report-view';
import type { AnalysisResponse } from '@/lib/api';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Generate dynamic metadata with noindex
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const report = await prisma.sharedReport.findUnique({
      where: { id },
      select: {
        vehicleYear: true,
        vehicleMake: true,
        vehicleModel: true,
        verdict: true,
      },
    });

    if (!report) {
      return {
        title: 'Report Not Found',
        robots: { index: false, follow: false },
      };
    }

    const vehicleTitle = [report.vehicleYear, report.vehicleMake, report.vehicleModel]
      .filter(Boolean)
      .join(' ');

    const verdictText = report.verdict === 'BUY'
      ? 'Recommended'
      : report.verdict === 'MAYBE'
      ? 'Consider with caution'
      : report.verdict === 'PASS'
      ? 'Not recommended'
      : '';

    return {
      title: vehicleTitle
        ? `${vehicleTitle} Analysis | Car Lifespan Check`
        : 'Vehicle Analysis | Car Lifespan Check',
      description: vehicleTitle
        ? `Analysis report for ${vehicleTitle}${verdictText ? ` - ${verdictText}` : ''}`
        : 'Shared vehicle analysis report',
      robots: { index: false, follow: false },
    };
  } catch {
    return {
      title: 'Report Not Found',
      robots: { index: false, follow: false },
    };
  }
}

export default async function SharedReportPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch the report and increment view count
  let report;
  try {
    report = await prisma.sharedReport.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  } catch (error) {
    // Handle not found
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      notFound();
    }
    throw error;
  }

  if (!report) {
    notFound();
  }

  const analysisData = report.analysisData as unknown as AnalysisResponse;

  return (
    <SharedReportView
      analysisData={analysisData}
      createdAt={report.createdAt.toISOString()}
    />
  );
}
