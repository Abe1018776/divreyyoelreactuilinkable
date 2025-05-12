
// app/api/search/route.ts
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

interface SearchResult {
  dvar: DvarTorahItem;
  type: 'Torah' | 'Moadim';
  seder?: string;
  parsha: string;
  matchType: 'title' | 'summary' | 'content';
  matchText: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: 'Search query must be at least 2 characters' }, { status: 400 });
  }

  try {
    const processedDataDir = path.join(process.cwd(), 'public', '_processed_data');
    const results: SearchResult[] = [];

    // Get all types (Torah, Moadim)
    const typesContent = await fs.readFile(path.join(processedDataDir, 'types.json'), 'utf-8');
    const types: string[] = JSON.parse(typesContent);

    // Handle Torah content
    if (types.includes('Torah')) {
      const sedarimContent = await fs.readFile(path.join(processedDataDir, 'sedarim.json'), 'utf-8');
      const sedarim: string[] = JSON.parse(sedarimContent);

      for (const seder of sedarim) {
        try {
          const parshiotFilePath = path.join(processedDataDir, `parshiot-Torah-${seder}.json`);
          const parshiotContent = await fs.readFile(parshiotFilePath, 'utf-8');
          const parshiot: string[] = JSON.parse(parshiotContent);

          for (const parsha of parshiot) {
            try {
              const contentFilePath = path.join(processedDataDir, `content-Torah-${seder}-${parsha}.json`);
              const contentFileExists = await fs.stat(contentFilePath).catch(() => false);
              
              if (contentFileExists) {
                const contentContent = await fs.readFile(contentFilePath, 'utf-8');
                const dvarim: DvarTorahItem[] = JSON.parse(contentContent);

                for (const dvar of dvarim) {
                  // Search in title
                  if (dvar.title && dvar.title.toLowerCase().includes(query.toLowerCase())) {
                    results.push({
                      dvar,
                      type: 'Torah',
                      seder,
                      parsha,
                      matchType: 'title',
                      matchText: dvar.title,
                    });
                    continue; // Found in title, no need to check other fields
                  }

                  // Search in summary
                  if (dvar.summary && dvar.summary.toLowerCase().includes(query.toLowerCase())) {
                    results.push({
                      dvar,
                      type: 'Torah',
                      seder,
                      parsha,
                      matchType: 'summary',
                      matchText: dvar.summary,
                    });
                    continue; // Found in summary, no need to check content
                  }

                  // Search in contents
                  if (dvar.contents && dvar.contents.length > 0) {
                    for (const passage of dvar.contents) {
                      if (passage.passage_content && passage.passage_content.toLowerCase().includes(query.toLowerCase())) {
                        results.push({
                          dvar,
                          type: 'Torah',
                          seder,
                          parsha,
                          matchType: 'content',
                          matchText: passage.passage_content,
                        });
                        break; // Found in this passage, no need to check others
                      }
                    }
                  }
                }
              }
            } catch (err) {
              console.error(`Error processing Torah content for ${seder}/${parsha}:`, err);
            }
          }
        } catch (err) {
          console.error(`Error processing parshiot for seder ${seder}:`, err);
        }
      }
    }

    // Handle Moadim content
    if (types.includes('Moadim')) {
      try {
        const moadimFilePath = path.join(processedDataDir, 'moadim.json');
        const moadimContent = await fs.readFile(moadimFilePath, 'utf-8');
        const moadim: string[] = JSON.parse(moadimContent);

        for (const moed of moadim) {
          try {
            const contentFilePath = path.join(processedDataDir, `content-Moadim-${moed}.json`);
            const contentFileExists = await fs.stat(contentFilePath).catch(() => false);
            
            if (contentFileExists) {
              const contentContent = await fs.readFile(contentFilePath, 'utf-8');
              const dvarim: DvarTorahItem[] = JSON.parse(contentContent);

              for (const dvar of dvarim) {
                // Search in title
                if (dvar.title && dvar.title.toLowerCase().includes(query.toLowerCase())) {
                  results.push({
                    dvar,
                    type: 'Moadim',
                    parsha: moed,
                    matchType: 'title',
                    matchText: dvar.title,
                  });
                  continue; // Found in title, no need to check other fields
                }

                // Search in summary
                if (dvar.summary && dvar.summary.toLowerCase().includes(query.toLowerCase())) {
                  results.push({
                    dvar,
                    type: 'Moadim',
                    parsha: moed,
                    matchType: 'summary',
                    matchText: dvar.summary,
                  });
                  continue; // Found in summary, no need to check content
                }

                // Search in contents
                if (dvar.contents && dvar.contents.length > 0) {
                  for (const passage of dvar.contents) {
                    if (passage.passage_content && passage.passage_content.toLowerCase().includes(query.toLowerCase())) {
                      results.push({
                        dvar,
                        type: 'Moadim',
                        parsha: moed,
                        matchType: 'content',
                        matchText: passage.passage_content,
                      });
                      break; // Found in this passage, no need to check others
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.error(`Error processing Moadim content for ${moed}:`, err);
          }
        }
      } catch (err) {
        console.error('Error processing moadim:', err);
      }
    }

    return NextResponse.json({ 
      results,
      count: results.length,
      query 
    });
  } catch (error) {
    console.error('API Error in search:', error);
    return NextResponse.json({ error: 'Failed to search corpus' }, { status: 500 });
  }
}
