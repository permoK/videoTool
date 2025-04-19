import VideoMerger from '@/components/VideoMerger';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-center mb-2">Video Merger</h1>
        <p className="text-center text-gray-600 mb-8">
          Upload and merge multiple videos in your browser
        </p>
        <VideoMerger />
      </div>
    </main>
  );
}
