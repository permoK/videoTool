import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
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

    // Create a file list for FFmpeg
    const fileListPath = join(tempDir, 'file_list.txt');
    const fileListContent = filePaths.map(path => `file '${path}'`).join('\n');
    await writeFile(fileListPath, fileListContent);

    // Create FFmpeg command to merge videos
    const outputPath = join(outputDir, `merged_${Date.now()}.mp4`);
    
    // First, normalize all videos to the same format and properties
    const normalizeCommands = await Promise.all(
      filePaths.map(async (path, index) => {
        const normalizedPath = join(tempDir, `normalized_${index}.mp4`);
        const command = `ffmpeg -i ${path} -c:v libx264 -preset ultrafast -crf 23 -c:a aac -b:a 192k -r 30 -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" ${normalizedPath}`;
        await execAsync(command);
        return normalizedPath;
      })
    );

    // Create a new file list with normalized videos
    const normalizedFileListPath = join(tempDir, 'normalized_file_list.txt');
    const normalizedFileListContent = normalizeCommands.map(path => `file '${path}'`).join('\n');
    await writeFile(normalizedFileListPath, normalizedFileListContent);

    // Merge the normalized videos
    const mergeCommand = `ffmpeg -f concat -safe 0 -i ${normalizedFileListPath} -c copy ${outputPath}`;
    await execAsync(mergeCommand);

    // Clean up temporary files
    await Promise.all([
      ...filePaths.map(path => execAsync(`rm ${path}`)),
      ...normalizeCommands.map(path => execAsync(`rm ${path}`)),
      execAsync(`rm ${fileListPath}`),
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