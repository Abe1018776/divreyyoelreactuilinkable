// scripts/process-data.mjs
import fs from 'fs-extra';
import path from 'path';
import Papa from 'papaparse';

// Define directories
const RAW_CSVS_DIR = path.join(process.cwd(), '_data_sources', 'all_csvs');
const PROCESSED_DATA_DIR = path.join(process.cwd(), 'public', '_processed_data');

// Helper to read and parse a single CSV
async function parseCsv(filePath) {
  console.log(`PROCESSOR: Parsing CSV: ${path.basename(filePath)}`);
  const csvFileContent = await fs.readFile(filePath, 'utf8');
  return new Promise((resolve, reject) => {
    Papa.parse(csvFileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        if (results.errors.length > 0) {
          results.errors.forEach(err => console.warn(`PROCESSOR: CSV parsing error in ${path.basename(filePath)}: ${err.type} - ${err.code} - ${err.message} (Row: ${err.row})`));
        }
        console.log(`PROCESSOR: Parsed ${results.data.length} rows from ${path.basename(filePath)}`);
        resolve(results.data);
      },
      error: (error) => {
        console.error(`PROCESSOR: Failed to parse ${path.basename(filePath)}:`, error);
        reject(error);
      },
    });
  });
}

// Main processing function
async function processAllData() {
  console.log("PROCESSOR: Starting data processing...");
  await fs.ensureDir(PROCESSED_DATA_DIR);
  await fs.emptyDir(PROCESSED_DATA_DIR);

  const types = ["Torah", "Moadim"];
  await fs.writeJson(path.join(PROCESSED_DATA_DIR, 'types.json'), types);
  console.log('PROCESSOR: Generated types.json');

  const sedarimContent = {};
  const moadimContent = {};

  const allSedarimKeys = new Set();
  const allMoadimKeys = new Set();

  const csvFilesToProcess = [
    'כל_הפרשיות_חוץ_מאמור.csv',
    'אמור.csv',
    'all_moadim_combined.csv'
  ];

  for (const csvFileName of csvFilesToProcess) {
    const filePath = path.join(RAW_CSVS_DIR, csvFileName);
    if (!await fs.pathExists(filePath)) {
        console.warn(`PROCESSOR: CSV file not found, skipping: ${filePath}`);
        continue;
    }

    const csvData = await parseCsv(filePath);

    for (const row of csvData) {
      const rowType = (row.type || '').toLowerCase().trim();
      const dvarTorahId = row.dvar_torah_id;
      const passageText = row.text; // Column D
      const hebrewTitle = row.hebrew_title || ''; // Column G
      const hebrewSummary = row.hebrew_summary || ''; // Column H
      const passageId = row.paragraph_id; // Column C

      if (!dvarTorahId || typeof passageText === 'undefined') {
        continue;
      }

      if (rowType === 'torah') {
        const sederKey = row.seder;    // Column I in Parshios CSV
        const parshaKey = row.parsha;  // Column F in Parshios CSV

        if (!sederKey || !parshaKey || typeof sederKey !== 'string' || typeof parshaKey !== 'string' || !sederKey.trim() || !parshaKey.trim() ) {
            console.warn('PROCESSOR: Skipping Torah row due to missing/invalid seder or parsha key:', row);
            continue;
        }
        const trimmedSederKey = sederKey.trim();
        const trimmedParshaKey = parshaKey.trim();

        allSedarimKeys.add(trimmedSederKey);

        if (!sedarimContent[trimmedSederKey]) {
          sedarimContent[trimmedSederKey] = { parshiot: new Set(), contentByParsha: {} };
        }
        sedarimContent[trimmedSederKey].parshiot.add(trimmedParshaKey);

        if (!sedarimContent[trimmedSederKey].contentByParsha[trimmedParshaKey]) {
          sedarimContent[trimmedSederKey].contentByParsha[trimmedParshaKey] = {};
        }
        if (!sedarimContent[trimmedSederKey].contentByParsha[trimmedParshaKey][dvarTorahId]) {
          sedarimContent[trimmedSederKey].contentByParsha[trimmedParshaKey][dvarTorahId] = {
            dvar_torah_id: dvarTorahId, title: hebrewTitle, summary: hebrewSummary, contents: [],
          };
        }
        const currentDvar = sedarimContent[trimmedSederKey].contentByParsha[trimmedParshaKey][dvarTorahId];
        if (!currentDvar.title && hebrewTitle) currentDvar.title = hebrewTitle;
        if (!currentDvar.summary && hebrewSummary) currentDvar.summary = hebrewSummary;

        // Skip completely empty passage texts
        if (!passageText || passageText.trim() === '') {
          continue;
        }

        // Check for duplicates by passage ID or content
        const isDuplicateId = passageId && currentDvar.contents.some(
          existing => existing.passage_id === passageId
        );

        const isDuplicateContent = currentDvar.contents.some(
          existing => existing.passage_content === passageText
        );

        // Skip if duplicate content or ID
        if (!isDuplicateId && !isDuplicateContent) {
          // Generate a unique ID if none provided or if it would be a duplicate
          const uniquePassageId = isDuplicateId ? 
            `${dvarTorahId}_p${currentDvar.contents.length + 1}_${Date.now().toString(36)}` : 
            (passageId || `${dvarTorahId}_p${currentDvar.contents.length + 1}`);

          currentDvar.contents.push({
            passage_id: uniquePassageId,
            passage_content: passageText,
          });
        }

      } else if (rowType === 'moadim') {
        const moedKeyFromMoadimColumn = row.moadim; // Using 'moadim' (Column I) as the Moed KEY
        const moedKeyFromParshaColumn = row.parsha; // 'parsha' (Column F) might be a sub-category or specific reading for the moed

        // Determine the primary key for the Moed. Let's prioritize the 'moadim' column if present.
        // If 'moadim' column (e.g. "שבועות") is the main Yom Tov and 'parsha' column (e.g. "shavuos") is a slug,
        // you might want to use the slug for filenames and the display name for listing.
        // For simplicity and consistency with how the 'parsha' column is used for keys elsewhere:
        // If 'moadim' (Col I) is for display and 'parsha' (Col F, e.g. 'shavuos') is the key, use 'parsha'.
        // If 'moadim' (Col I) is the *actual key* you want to use, use row.moadim.
        // Let's assume from your question that column I 'moadim' (e.g., "שבועות") is the desired key for the Yom Tov.

        const moedKey = moedKeyFromMoadimColumn; // Use content from Column I

        if (!moedKey || typeof moedKey !== 'string' || moedKey.trim() === '') {
            console.warn('PROCESSOR: Skipping Moadim row due to missing or invalid moed key (from moadim column):', row.moadim, 'Row:', row);
            continue;
        }
        const trimmedMoedKey = moedKey.trim();
        allMoadimKeys.add(trimmedMoedKey);

        if (!moadimContent[trimmedMoedKey]) moadimContent[trimmedMoedKey] = {};
        if (!moadimContent[trimmedMoedKey][dvarTorahId]) {
          moadimContent[trimmedMoedKey][dvarTorahId] = {
            dvar_torah_id: dvarTorahId, title: hebrewTitle, summary: hebrewSummary, contents: [],
          };
        }
        const currentDvar = moadimContent[trimmedMoedKey][dvarTorahId];
        if (!currentDvar.title && hebrewTitle) currentDvar.title = hebrewTitle;
        if (!currentDvar.summary && hebrewSummary) currentDvar.summary = hebrewSummary;
        currentDvar.contents.push({
          passage_id: passageId || `${dvarTorahId}_p${currentDvar.contents.length + 1}`,
          passage_content: passageText,
        });
      }
    }
  }

  // --- Save Processed Torah Data ---
  if (allSedarimKeys.size > 0) {
    await fs.writeJson(path.join(PROCESSED_DATA_DIR, 'sedarim.json'), Array.from(allSedarimKeys).sort());
    console.log('PROCESSOR: Generated sedarim.json');
    for (const sederKey of allSedarimKeys) {
      if (sedarimContent[sederKey]) {
        await fs.writeJson(
          path.join(PROCESSED_DATA_DIR, `parshiot-Torah-${sederKey}.json`),
          Array.from(sedarimContent[sederKey].parshiot).sort()
        );
        console.log(`PROCESSOR: Generated parshiot-Torah-${sederKey}.json`);
        for (const parshaKey of sedarimContent[sederKey].parshiot) {
          if (sedarimContent[sederKey].contentByParsha[parshaKey]) {
            await fs.writeJson(
              path.join(PROCESSED_DATA_DIR, `content-Torah-${sederKey}-${parshaKey}.json`),
              Object.values(sedarimContent[sederKey].contentByParsha[parshaKey])
            );
            console.log(`PROCESSOR: Generated content-Torah-${sederKey}-${parshaKey}.json`);
          }
        }
      }
    }
  } else {
    console.log("PROCESSOR: No Torah data found/processed. Check CSV and column names.");
    await fs.ensureFile(path.join(PROCESSED_DATA_DIR, 'sedarim.json'));
    await fs.writeJson(path.join(PROCESSED_DATA_DIR, 'sedarim.json'), []);
  }

  // --- Save Processed Moadim Data ---
  if (allMoadimKeys.size > 0) {
    await fs.writeJson(path.join(PROCESSED_DATA_DIR, 'moadim.json'), Array.from(allMoadimKeys).sort());
    console.log('PROCESSOR: Generated moadim.json');
    for (const moedKey of allMoadimKeys) {
      if (moadimContent[moedKey]) {
        await fs.writeJson(
          path.join(PROCESSED_DATA_DIR, `content-Moadim-${moedKey}.json`),
          Object.values(moadimContent[moedKey])
        );
        console.log(`PROCESSOR: Generated content-Moadim-${moedKey}.json`);
      }
    }
  } else {
    console.log("PROCESSOR: No Moadim data found/processed. Check CSV and column names.");
    await fs.ensureFile(path.join(PROCESSED_DATA_DIR, 'moadim.json'));
    await fs.writeJson(path.join(PROCESSED_DATA_DIR, 'moadim.json'), []);
  }

  console.log('PROCESSOR: Data processing complete!');
}

processAllData().catch(err => {
  console.error('PROCESSOR: Error during data processing script:', err);
  process.exit(1);
});