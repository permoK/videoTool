#!/bin/bash

# Install FFmpeg
sudo apt-get update
sudo apt-get install -y ffmpeg

# Create necessary directories with proper permissions
mkdir -p temp
mkdir -p public/merged
mkdir -p public/merged/videos

# Set permissions
chmod -R 777 temp
chmod -R 777 public/merged
chmod -R 777 public/merged/videos

# Create a test file to verify permissions
touch temp/test.txt
touch public/merged/test.txt

# Verify FFmpeg installation
ffmpeg -version

echo "Setup complete! FFmpeg is installed and directories are created with proper permissions." 