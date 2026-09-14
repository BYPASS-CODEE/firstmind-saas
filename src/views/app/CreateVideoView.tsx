import React, { useState } from 'react';
import { 
  Video, 
  Upload, 
  Sparkles, 
  Download, 
  Play, 
  Film, 
  Zap, 
  AlertCircle,
  Eye,
  Sliders
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { GenerationJob } from '../../types';

interface CreateVideoViewProps {
  toolMode: 'text' | 'image';
  navigate: (path: string) => void;
}

export const CreateVideoView: React.FC<CreateVideoViewProps> = ({ toolMode, navigate }) => {
  const { subscription, refreshUser } = useAuth();
  const { t } = useLanguage();

  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState<number>(6);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [sourceImageBase64, setSourceImageBase64] = useState<string | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [sourceImageMimeType, setSourceImageMimeType] = useState('image/png');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationJob, setGenerationJob] = useState<GenerationJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remainingCredits = subscription ? Math.max(0, subscription.creditsTotal - subscription.creditsUsed) : 0;
  const creditCost = 10; // Veo temporal video synthesis
  const hasEnoughCredits = remainingCredits >= creditCost;

  const sampleVideoPrompts = [
    'A cinematic drone flight panning over mist-covered Nordic fjords with waterfalls cascading into mirror-like water, 4k 24fps.',
    'Time-lapse of bustling Shibuya crossing at rainy midnight with neon reflections on wet asphalt and vehicle light trails.',
    'A serene slow-motion close up of golden autumn leaves drifting in sunlight across a tranquil mountain stream.'
  ];

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid initial frame image.');
      return;
    }
    setSourceImageMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSourceImageBase64(result.split(',')[1]);
      setSourcePreviewUrl(result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please describe the temporal camera motion and visual scene.');
      return;
    }

    if (toolMode === 'image' && !sourceImageBase64) {
      setError('Please upload an initial keyframe image for Image-to-Video synthesis.');
      return;
    }

    if (!hasEnoughCredits) {
      setError('Insufficient credits for video synthesis. Please upgrade to Pro or Elite tier.');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setGenerationJob(null);

    try {
      const job = await api.generateVideo({
        tool: toolMode === 'text' ? 'TEXT_TO_VIDEO' : 'IMAGE_TO_VIDEO',
        prompt: prompt.trim(),
        duration,
        aspectRatio,
        sourceImageBase64: sourceImageBase64 || undefined,
        sourceImageMimeType: sourceImageBase64 ? sourceImageMimeType : undefined
      });

      setGenerationJob(job);
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Video generation failed.');
      await refreshUser();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {toolMode === 'text' ? 'Text to Video Studio' : 'Image to Video Engine'}
            </h1>
            <Badge variant="warning" size="sm">Veo Motion Diffusion</Badge>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Temporal neural synthesis producing continuous 24fps motion sequences.
          </p>
        </div>

        {/* Credit Cost Badge */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
            <span>Cost: <strong>{creditCost}</strong> Credits</span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span className="text-zinc-500">Balance: <strong className="text-zinc-900 dark:text-zinc-100">{remainingCredits}</strong></span>
          </div>
        </div>
      </div>

      {/* Mode navigation */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => navigate('/create/video/text')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
            toolMode === 'text'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Text to Video
        </button>
        <button
          onClick={() => navigate('/create/video/image')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
            toolMode === 'image'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Image to Video
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* If Image-to-Video: Keyframe upload */}
          {toolMode === 'image' && (
            <Card className="p-4 space-y-3">
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5" />
                <span>Initial Keyframe Image (Required)</span>
              </label>

              {sourcePreviewUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 max-h-56 flex items-center justify-center">
                  <img
                    src={sourcePreviewUrl}
                    alt="Keyframe Preview"
                    referrerPolicy="no-referrer"
                    className="max-h-56 w-auto object-contain rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setSourceImageBase64(null);
                      setSourcePreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 px-2 py-1 bg-zinc-900/80 text-white rounded text-xs hover:bg-zinc-900"
                  >
                    Change Image
                  </button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-6 text-center hover:border-zinc-400 cursor-pointer"
                  onClick={() => document.getElementById('video-frame-input')?.click()}
                >
                  <Upload className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    Upload starting image frame
                  </p>
                  <input
                    id="video-frame-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              )}
            </Card>
          )}

          {/* Video Motion Prompt */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" />
                <span>Temporal Motion & Scene Prompt</span>
              </label>
              <span className="text-[11px] text-zinc-400">{prompt.length} chars</span>
            </div>

            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe subjects, camera movements (slow pan, dolly zoom, orbit), lighting changes, and environmental physics..."
              className="w-full p-3 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 leading-relaxed resize-none"
            />

            <div className="space-y-1.5">
              <span className="text-[11px] text-zinc-400 font-medium">Cinematic Samples:</span>
              <div className="flex flex-wrap gap-1.5">
                {sampleVideoPrompts.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(sample)}
                    className="text-[11px] px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 truncate max-w-xs text-left cursor-pointer transition-colors"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Video Settings */}
          <Card className="p-4 space-y-4">
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Video Diffusion Specs</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-600 dark:text-zinc-400">Duration (Seconds)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                  className="w-full h-9 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
                >
                  <option value={6}>6 Seconds Sequence (Standard)</option>
                  <option value={15}>15 Seconds Extended (Pro/Elite)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-zinc-600 dark:text-zinc-400">Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full h-9 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
                >
                  <option value="16:9">16:9 (Widescreen Landscape)</option>
                  <option value="9:16">9:16 (Vertical Mobile Reel)</option>
                </select>
              </div>
            </div>
          </Card>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Synthesis Error</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerate}
            isLoading={isGenerating}
            disabled={!hasEnoughCredits}
            leftIcon={<Video className="w-4 h-4" />}
            className="w-full shadow-md"
          >
            {isGenerating ? 'Synthesizing Veo Video...' : `Synthesize Video Sequence (${creditCost} Credits)`}
          </Button>
        </div>

        {/* Right Output Video Player (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-4 min-h-[480px] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5" />
                <span>Video Player</span>
              </span>
              {generationJob?.status && (
                <Badge variant={generationJob.status === 'COMPLETED' ? 'success' : 'neutral'} size="sm">
                  {generationJob.status}
                </Badge>
              )}
            </div>

            <div className="my-auto py-4 flex flex-col items-center justify-center">
              {isGenerating ? (
                <div className="text-center space-y-4 p-8">
                  <div className="w-12 h-12 rounded-full border-2 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-zinc-100 animate-spin mx-auto" />
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Generating Temporal Diffusion Frames
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Synthesizing 24fps motion vectors via Veo backend pipeline...
                    </p>
                  </div>
                </div>
              ) : generationJob?.outputMetadata?.assetUrl ? (
                <div className="space-y-4 w-full text-center">
                  <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 flex items-center justify-center">
                    {/* If output is video MP4 or fallback animation */}
                    <video
                      src={generationJob.outputMetadata.assetUrl}
                      controls
                      autoPlay
                      loop
                      className="w-full h-auto max-h-[380px] object-contain rounded-lg"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 text-left text-xs space-y-1">
                    <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                      <span>Duration:</span>
                      <span className="font-mono text-zinc-900 dark:text-zinc-100">{generationJob.outputMetadata.duration || duration}s</span>
                    </div>
                    <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                      <span>Aspect Ratio:</span>
                      <span className="font-mono text-zinc-900 dark:text-zinc-100">{generationJob.inputMetadata.aspectRatio}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <a
                      href={generationJob.outputMetadata.assetUrl}
                      download={`firstmind-veo-${generationJob.id}.mp4`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button
                        variant="primary"
                        size="md"
                        leftIcon={<Download className="w-4 h-4" />}
                        className="w-full"
                      >
                        Download Video
                      </Button>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 space-y-2 text-zinc-400">
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mx-auto text-zinc-400">
                    <Video className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Video Canvas Ready</h4>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                    Configure your temporal prompt on the left to synthesize smooth cinematic motion.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
};
