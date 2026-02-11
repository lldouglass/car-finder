import { NextResponse } from 'next/server';
import { getMakesForYear } from '@/lib/nhtsa';

// In-memory cache for makes (NHTSA data is static)
const makesCache = new Map<string, { data: string[]; timestamp: number }>();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const yearStr = searchParams.get('year');

        if (!yearStr) {
            return NextResponse.json(
                { success: false, error: 'year parameter is required' },
                { status: 400 }
            );
        }

        const year = parseInt(yearStr, 10);
        if (isNaN(year) || year < 1981 || year > new Date().getFullYear() + 1) {
            return NextResponse.json(
                { success: false, error: 'Invalid year' },
                { status: 400 }
            );
        }

        const cacheKey = `makes`;
        const cached = makesCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return NextResponse.json({ success: true, makes: cached.data });
        }

        const makes = await getMakesForYear(year);
        makesCache.set(cacheKey, { data: makes, timestamp: Date.now() });

        return NextResponse.json({ success: true, makes });
    } catch (error) {
        console.error('Error fetching makes:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch makes' },
            { status: 500 }
        );
    }
}
