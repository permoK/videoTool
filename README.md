# Video Merger

A powerful web application for merging multiple videos with customizable quality settings and compression options.

## Features

- **Drag and Drop Interface**: Easy video upload with drag and drop support
- **Multiple Format Support**: Works with MP4, AVI, MOV, MKV, and WebM files
- **Quality Controls**:
  - Resolution presets (4K, 1080p, 720p, 480p, 360p)
  - Custom frame rate selection
  - Multiple output formats (MP4, WebM, MOV)
  - Compression levels (No Compression to High Compression)
- **Fast Processing**: Uses FFmpeg for efficient video processing
- **Preview and Download**: Preview merged videos before downloading

## Setup

1. Create a Python virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Linux/Mac
# OR
.\venv\Scripts\activate  # On Windows
```

2. Install dependencies:
```bash
npm install
```

3. Install FFmpeg (required for video processing):
```bash
sudo apt-get update
sudo apt-get install -y ffmpeg
```

4. Run the setup script:
```bash
./scripts/setup.sh
```

## Usage

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and go to `http://localhost:3000`

3. Upload videos by dragging and dropping them onto the interface

4. Configure quality settings:
   - Select a quality preset (4K, 1080p, etc.)
   - Choose compression level
   - Select output format
   - Adjust frame rate if needed

5. Click "Merge Videos" to process

6. Preview and download the merged video

## Quality Settings

### Resolution Presets
- 4K (3840x2160)
- 1080p (1920x1080)
- 720p (1280x720)
- 480p (854x480)
- 360p (640x360)

### Compression Levels
- No Compression: Best quality, larger file size
- Light Compression: Good quality, moderate file size
- Medium Compression: Balanced quality and size
- High Compression: Smaller file size, reduced quality

### Output Formats
- MP4 (H.264): Best compatibility
- WebM (VP9): Better compression
- MOV (ProRes): Professional quality

## Project Structure

```
video-merger-web/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── merge/      # Video processing API
│   │   └── page.tsx        # Main page
│   └── components/
│       └── VideoMerger.tsx # Video merger component
├── public/
│   └── merged/            # Output directory
├── temp/                  # Temporary files
└── scripts/
    └── setup.sh          # Setup script
```

## Supported Video Formats

- MP4 (.mp4)
- AVI (.avi)
- MOV (.mov)
- MKV (.mkv)
- WebM (.webm)

## Notes

- Temporary files are automatically cleaned up after processing
- Merged videos are stored in the `public/merged` directory
- Original video quality is preserved unless compression is applied
- Processing time depends on video size and quality settings
