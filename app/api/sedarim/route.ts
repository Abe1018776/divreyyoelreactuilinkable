// app/api/sedarim/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic"; // Ensures fresh read, good for debugging

export async function GET() {
  const functionName = "API /api/sedarim";
  console.log(`\n[${functionName}] Received GET request.`);

  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "_processed_data",
      "sedarim.json",
    );
    console.log(`[${functionName}] Attempting to read file: ${filePath}`);

    let fileContent: string;
    try {
      fileContent = await fs.readFile(filePath, "utf-8");
      console.log(
        `[${functionName}] Successfully read file content. Length: ${fileContent.length}`,
      );
    } catch (readError: any) {
      console.error(
        `[${functionName}] Error reading file at ${filePath}:`,
        readError.message,
        readError.code,
      );
      if (readError.code === "ENOENT") {
        return NextResponse.json(
          { error: "Sedarim data file not found.", sedarim: [] },
          { status: 404 },
        );
      }
      return NextResponse.json(
        {
          error: "Failed to read Sedarim data file.",
          details: readError.message,
        },
        { status: 500 },
      );
    }

    let sedarimArray: string[];
    try {
      sedarimArray = JSON.parse(fileContent);
      console.log(
        `[${functionName}] Successfully parsed JSON. Number of items: ${sedarimArray.length}`,
      );
      if (!Array.isArray(sedarimArray)) {
        console.error(
          `[${functionName}] Parsed data is not an array. Type: ${typeof sedarimArray}`,
          sedarimArray,
        );
        throw new Error("Parsed Sedarim data is not an array.");
      }
      // Optional: Check if items are strings
      // if (sedarimArray.some(item => typeof item !== 'string')) {
      //   console.error(`[${functionName}] Parsed array contains non-string items.`);
      //   throw new Error("Sedarim array contains non-string items.");
      // }
    } catch (parseError: any) {
      console.error(
        `[${functionName}] Error parsing JSON content from sedarim.json:`,
        parseError.message,
      );
      console.error(
        `[${functionName}] File content was:`,
        fileContent.substring(0, 200) + "...",
      ); // Log snippet of content
      return NextResponse.json(
        {
          error: "Failed to parse Sedarim data.",
          details: parseError.message,
          sedarim: [],
        },
        { status: 500 },
      );
    }

    console.log(`[${functionName}] Returning sedarim list:`, sedarimArray);
    return NextResponse.json({ sedarim: sedarimArray });
  } catch (error: any) {
    console.error(
      `[${functionName}] Unhandled catch-all error:`,
      error.message,
      error.stack,
    );
    return NextResponse.json(
      {
        error: "Internal server error while fetching sedarim.",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
