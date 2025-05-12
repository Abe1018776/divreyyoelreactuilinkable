// app/api/content/route.ts
import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

interface PassageContent {
  passage_id: string;
  passage_content: string;
}
interface DvarTorahItem {
  dvar_torah_id: string;
  title: string;
  summary: string;
  contents: PassageContent[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const sederKey = searchParams.get('seder'); // For type === 'Torah'
  const itemKey = searchParams.get('parsha');  // This is the Parsha key (if Torah) or Moed key (if Moadim)

  if (!type || !itemKey) {
    return NextResponse.json({ error: 'Missing type or item key (parsha/moed)' }, { status: 400 });
  }
  if (type === 'Torah' && !sederKey) {
    return NextResponse.json({ error: 'Missing seder parameter for Torah content' }, { status: 400 });
  }

  try {
    // Sanitize keys for filename if they contain special characters or spaces
    // For now, assuming keys are filename-safe.
    const fileName = type === 'Torah'
      ? `content-Torah-${sederKey}-${itemKey}.json`
      : `content-Moadim-${itemKey}.json`;

    const filePath = path.join(process.cwd(), 'public', '_processed_data', fileName);
    const fileContent = await fs.readFile(filePath, 'utf-8');

    const contentArray: DvarTorahItem[] = JSON.parse(fileContent);

    // Client expects response: { parsha: { parsha_name: string, contents: DvarTorahItem[] } }
    return NextResponse.json({ 
      parsha: { // Using "parsha" as the key for the content object for client consistency
        parsha_name: itemKey, 
        seder_name: type === 'Torah' ? sederKey : undefined,
        contents: contentArray 
      } 
    });
  } catch (error: any) {
    console.error(`API Error fetching content (type: ${type}, seder: ${sederKey}, item: ${itemKey}):`, error);
    if (error.code === 'ENOENT') {
         return NextResponse.json({ error: `Content not found for ${itemKey}` }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to load content' }, { status: 500 });
  }
}