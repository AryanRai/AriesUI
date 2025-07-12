import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Helper to determine the category of a mod based on its name.
// This can be expanded with more sophisticated logic.
function getModCategory(filename: string): string {
  const lowerCaseName = filename.toLowerCase();
  if (lowerCaseName.includes('sensor')) return 'sensors';
  if (lowerCaseName.includes('control')) return 'controls';
  if (lowerCaseName.includes('chart') || lowerCaseName.includes('plot')) return 'visualization';
  if (lowerCaseName.includes('clock') || lowerCaseName.includes('utility')) return 'utility';
  return 'other'; // A fallback category
}

export async function POST(request: Request) {
  try {
    const { download_url, name } = await request.json();

    if (!download_url || !name) {
      return NextResponse.json({ message: 'Missing download_url or name' }, { status: 400 });
    }

    // 1. Fetch the mod code
    const response = await fetch(download_url);
    if (!response.ok) {
      throw new Error(`Failed to download mod from ${download_url}`);
    }
    const code = await response.text();

    // 2. Determine the installation path
    const category = getModCategory(name);
    const installDir = path.join(process.cwd(), 'ariesMods', category);
    const filePath = path.join(installDir, name);

    // 3. Ensure the directory exists
    await fs.mkdir(installDir, { recursive: true });

    // 4. Write the file
    await fs.writeFile(filePath, code);

    return NextResponse.json({ message: `Mod '${name}' installed successfully in '${category}'` });

  } catch (error) {
    console.error('Mod installation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Mod installation failed', error: errorMessage }, { status: 500 });
  }
} 