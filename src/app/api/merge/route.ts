import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface QualitySettings {
  resolution: string;
  bitrate: string;
  fps: number;
  compression: number;
  format: string;
}

const COMPRESSION_PRESETS = {
  0: { crf: 23, preset: 'ultrafast' }, // No compression
  1: { crf: 26, preset: 'veryfast' }, // Light compression
  2: { crf: 28, preset: 'fast' },     // Medium compression
  3: { crf: 30, preset: 'medium' },   // High compression
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const settings = JSON.parse(formData.get('settings') as string) as QualitySettings;
    
    if (files.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 videos are required' },
        { status: 400 }
      );
    }

    // Create necessary directories
    const tempDir = join(process.cwd(), 'temp');
    const outputDir = join(process.cwd(), 'public', 'merged');
    
    // Ensure directories exist
    await mkdir(tempDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });
    
    // Save uploaded files
    const filePaths = await Promise.all(
      files.map(async (file, index) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filePath = join(tempDir, `input_${index}.mp4`);
        await writeFile(filePath, buffer);
        return filePath;
      })
    );

    // Get compression settings
    const compression = COMPRESSION_PRESETS[settings.compression as keyof typeof COMPRESSION_PRESETS];

    // First, normalize all videos to the same format and properties
    const normalizeCommands = await Promise.all(
      filePaths.map(async (path, index) => {
        const normalizedPath = join(tempDir, `normalized_${index}.mp4`);
        const command = `ffmpeg -i ${path} -c:v libx264 -preset ${compression.preset} -crf ${compression.crf} -c:a aac -b:a 192k -r ${settings.fps} -vf "scale=${settings.resolution}:force_original_aspect_ratio=decrease,pad=${settings.resolution}:(ow-iw)/2:(oh-ih)/2" ${normalizedPath}`;
        await execAsync(command);
        return normalizedPath;
      })
    );

    // Create a new file list with normalized videos
    const normalizedFileListPath = join(tempDir, 'normalized_file_list.txt');
    const normalizedFileListContent = normalizeCommands.map(path => `file '${path}'`).join('\n');
    await writeFile(normalizedFileListPath, normalizedFileListContent);

    // Merge the normalized videos
    const outputPath = join(outputDir, `merged_${Date.now()}.${settings.format}`);
    let mergeCommand = '';

    switch (settings.format) {
      case 'webm':
        mergeCommand = `ffmpeg -f concat -safe 0 -i ${normalizedFileListPath} -c:v libvpx-vp9 -b:v ${settings.bitrate} -c:a libopus -b:a 192k ${outputPath}`;
        break;
      case 'mov':
        mergeCommand = `ffmpeg -f concat -safe 0 -i ${normalizedFileListPath} -c:v prores_ks -profile:v 3 -c:a pcm_s16le ${outputPath}`;
        break;
      default: // mp4
        mergeCommand = `ffmpeg -f concat -safe 0 -i ${normalizedFileListPath} -c:v libx264 -preset ${compression.preset} -crf ${compression.crf} -c:a aac -b:a 192k ${outputPath}`;
    }

    await execAsync(mergeCommand);

    // Clean up temporary files
    await Promise.all([
      ...filePaths.map(path => execAsync(`rm ${path}`)),
      ...normalizeCommands.map(path => execAsync(`rm ${path}`)),
      execAsync(`rm ${normalizedFileListPath}`)
    ]);

    // Return the URL of the merged video
    const videoUrl = `/merged/${outputPath.split('/').pop()}`;
    return NextResponse.json({ url: videoUrl });

  } catch (error) {
    console.error('Error merging videos:', error);
    return NextResponse.json(
      { error: 'Failed to merge videos' },
      { status: 500 }
    );
  }
} 