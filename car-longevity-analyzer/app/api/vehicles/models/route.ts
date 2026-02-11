import { NextResponse } from 'next/server';
import { getModelsForMakeYear } from '@/lib/nhtsa';

// In-memory cache for models (keyed by make+year)
const modelsCache = new Map<string, { data: string[]; timestamp: number }>();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const yearStr = searchParams.get('year');
        const make = searchParams.get('make');

        if (!yearStr || !make) {
            return NextResponse.json(
                { success: false, error: 'year and make parameters are required' },
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

        const cacheKey = `${make.toLowerCase()}-${year}`;
        const cached = modelsCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return NextResponse.json({ success: true, models: cached.data });
        }

        const models = await getModelsForMakeYear(make, year);
        modelsCache.set(cacheKey, { data: models, timestamp: Date.now() });

        return NextResponse.json({ success: true, models });
    } catch (error) {
        console.error('Error fetching models:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch models' },
            { status: 500 }
        );
    }
}
