'use client';

import { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';

interface VideoFile {
  file: File;
  url: string;
  duration: number;
}

interface QualitySettings {
  resolution: string;
  bitrate: string;
  fps: number;
  compression: number;
  format: string;
}

const QUALITY_PRESETS = {
  '4K': { resolution: '3840x2160', bitrate: '20M', fps: 30, compression: 0 },
  '1080p': { resolution: '1920x1080', bitrate: '8M', fps: 30, compression: 0 },
  '720p': { resolution: '1280x720', bitrate: '4M', fps: 30, compression: 0 },
  '480p': { resolution: '854x480', bitrate: '2M', fps: 30, compression: 0 },
  '360p': { resolution: '640x360', bitrate: '1M', fps: 30, compression: 0 },
};

const COMPRESSION_LEVELS = [
  { value: 0, label: 'No Compression' },
  { value: 1, label: 'Light Compression' },
  { value: 2, label: 'Medium Compression' },
  { value: 3, label: 'High Compression' },
];

const FORMATS = [
  { value: 'mp4', label: 'MP4 (H.264)' },
  { value: 'webm', label: 'WebM (VP9)' },
  { value: 'mov', label: 'MOV (ProRes)' },
];

export default function VideoMerger() {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mergedVideoUrl, setMergedVideoUrl] = useState<string | null>(null);
  const [settings, setSettings] = useState<QualitySettings>({
    resolution: '1920x1080',
    bitrate: '8M',
    fps: 30,
    compression: 0,
    format: 'mp4',
  });
  const videoRef = useRef<HTMLVideoElement>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.webm']
    },
    onDrop: async (acceptedFiles) => {
      setError(null);
      const newVideos = await Promise.all(
        acceptedFiles.map(async (file) => {
          const url = URL.createObjectURL(file);
          const duration = await getVideoDuration(url);
          return { file, url, duration };
        })
      );
      setVideos([...videos, ...newVideos]);
    }
  });

  const getVideoDuration = (url: string): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        resolve(video.duration);
      });
    });
  };

  const removeVideo = (index: number) => {
    const newVideos = [...videos];
    URL.revokeObjectURL(newVideos[index].url);
    newVideos.splice(index, 1);
    setVideos(newVideos);
  };

  const handleQualityChange = (preset: keyof typeof QUALITY_PRESETS) => {
    setSettings(QUALITY_PRESETS[preset]);
  };

  const mergeVideos = async () => {
    if (videos.length < 2) {
      setError('Please upload at least 2 videos to merge');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setMergedVideoUrl(null);
    setError(null);

    try {
      const formData = new FormData();
      videos.forEach((video) => {
        formData.append('files', video.file);
      });

      // Add quality settings to formData
      formData.append('settings', JSON.stringify(settings));

      const response = await fetch('/api/merge', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to merge videos');
      }

      const data = await response.json();
      setMergedVideoUrl(data.url);
      setProgress(100);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadMergedVideo = () => {
    if (!mergedVideoUrl) return;

    const link = document.createElement('a');
    link.href = mergedVideoUrl;
    link.download = `merged-video.${settings.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-600">
          {isDragActive
            ? 'Drop the videos here...'
            : 'Drag & drop videos here, or click to select files'}
        </p>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="mt-4 space-y-4">
        {videos.map((video, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-4">
              <video
                src={video.url}
                className="w-32 h-20 object-cover rounded"
                controls
              />
              <div>
                <p className="font-medium">{video.file.name}</p>
                <p className="text-sm text-gray-500">
                  Duration: {Math.round(video.duration)}s
                </p>
              </div>
            </div>
            <button
              onClick={() => removeVideo(index)}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {videos.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality Preset
              </label>
              <select
                className="w-full p-2 border rounded-lg"
                onChange={(e) => handleQualityChange(e.target.value as keyof typeof QUALITY_PRESETS)}
              >
                {Object.keys(QUALITY_PRESETS).map((preset) => (
                  <option key={preset} value={preset}>
                    {preset}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compression Level
              </label>
              <select
                className="w-full p-2 border rounded-lg"
                value={settings.compression}
                onChange={(e) => setSettings({ ...settings, compression: parseInt(e.target.value) })}
              >
                {COMPRESSION_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output Format
              </label>
              <select
                className="w-full p-2 border rounded-lg"
                value={settings.format}
                onChange={(e) => setSettings({ ...settings, format: e.target.value })}
              >
                {FORMATS.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frame Rate
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg"
                value={settings.fps}
                onChange={(e) => setSettings({ ...settings, fps: parseInt(e.target.value) })}
                min="1"
                max="60"
              />
            </div>
          </div>

          <button
            onClick={mergeVideos}
            disabled={isProcessing}
            className={`w-full py-2 px-4 rounded-lg font-medium ${
              isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Merge Videos'}
          </button>

          {isProcessing && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-center mt-2 text-gray-600">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}

          {!isProcessing && mergedVideoUrl && (
            <div className="mt-4 space-y-4">
              <video
                ref={videoRef}
                className="w-full rounded-lg"
                controls
                autoPlay
                src={mergedVideoUrl}
              />
              <button
                onClick={downloadMergedVideo}
                className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium"
              >
                Download Merged Video
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 