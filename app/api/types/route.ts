// app/api/types/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // The types.json file directly contains the array, e.g., ["Torah", "Moadim"]
    const filePath = path.join(process.cwd(), 'public', '_processed_data', 'types.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const typesArray = JSON.parse(fileContent);

    return NextResponse.json(typesArray); // Send the array directly
  } catch (error) {
    console.error('API Error fetching types:', error);
    return NextResponse.json({ error: 'Failed to load types' }, { status: 500 });
  }
}