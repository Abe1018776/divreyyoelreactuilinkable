// app/api/parshiot/route.ts
import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const sederKey = searchParams.get('seder'); // Only relevant for type === 'Torah'

  try {
    let fileName = '';
    if (type === 'Torah' && sederKey) {
      // Sanitize sederKey for filename if it contains special characters or spaces
      // For now, assuming sederKey is filename-safe (e.g., "בראשית", "שמות")
      // If your keys have spaces or problematic chars, you'd URL-encode them or map them.
      fileName = `parshiot-Torah-${sederKey}.json`;
    } else if (type === 'Moadim') {
      fileName = 'moadim.json'; // This file contains the list of Moed keys
    } else {
      return NextResponse.json({ error: 'Invalid parameters for parshiot/moadim list' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', '_processed_data', fileName);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const itemsArray = JSON.parse(fileContent);

    // Client expects data in format { parshiot: [...] }
    return NextResponse.json({ parshiot: itemsArray });
  } catch (error: any) {
    console.error(`API Error fetching parshiot/moadim list (type: ${type}, seder: ${sederKey}):`, error);
    if (error.code === 'ENOENT') {
        return NextResponse.json({ parshiot: [] }); // Gracefully return empty if specific list not found
    }
    return NextResponse.json({ error: 'Failed to load list' }, { status: 500 });
  }
}