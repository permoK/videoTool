'use client';

import { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';

interface VideoFile {
  file: File;
  url: string;
  duration: number;
}

export default function VideoMerger() {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [mergedVideoUrl, setMergedVideoUrl] = useState<string | null>(null);
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
    link.download = 'merged-video.mp4';
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
        <div className="mt-6">
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