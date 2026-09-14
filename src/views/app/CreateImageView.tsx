import React, { useState, useEffect } from 'react';
import { 
  Wand2, 
  Upload, 
  Sparkles, 
  Download, 
  Sliders, 
  Eye, 
  AlertCircle, 
  Zap,
  Image as ImageIcon,
  FlaskConical,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { GenerationJob } from '../../types';

interface CreateImageViewProps {
  toolMode: 'text' | 'image' | 'variation' | 'enhance' | 'style';
  navigate: (path: string) => void;
}

export const CreateImageView: React.FC<CreateImageViewProps> = ({ toolMode, navigate }) => {
  const { user, subscription, refreshUser, isDevTest } = useAuth();
  const { t, language } = useLanguage();

  const modeKeyMap: Record<string, string> = {
    text: 'TEXT_TO_IMAGE',
    image: 'IMAGE_TO_IMAGE',
    variation: 'VARIATION',
    enhance: 'ENHANCE',
    style: 'STYLE_TRANSFER'
  };

  const currentToolKey = modeKeyMap[toolMode] || 'TEXT_TO_IMAGE';

  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [resolution, setResolution] = useState('1024x1024');
  const [style, setStyle] = useState('Photorealistic');
  const [strength, setStrength] = useState(0.7);
  const [sourceImageBase64, setSourceImageBase64] = useState<string | null>(null);
  const [sourceImageMimeType, setSourceImageMimeType] = useState<string>('image/png');
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationJob, setGenerationJob] = useState<GenerationJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  useEffect(() => {
    const transferred = sessionStorage.getItem('firstmind_transfer_prompt');
    if (transferred) {
      setPrompt(transferred);
      sessionStorage.removeItem('firstmind_transfer_prompt');
    }
  }, []);

  const samplePrompts = language === 'fa' ? [
    t('samplePrompt1'),
    t('samplePrompt2'),
    t('samplePrompt3'),
    t('samplePrompt4')
  ] : [
    t('samplePrompt1'),
    t('samplePrompt2'),
    t('samplePrompt3'),
    t('samplePrompt4')
  ];

  const requiresSourceImage = toolMode === 'image' || toolMode === 'variation' || toolMode === 'enhance' || toolMode === 'style';
  const isGuest = !user;
  const remainingCredits = subscription ? Math.max(0, subscription.creditsTotal - subscription.creditsUsed) : (isGuest ? 1 : 0);
  const creditCost = currentToolKey === 'TEXT_TO_IMAGE' ? 1 : 2;
  const hasEnoughCredits = isDevTest ? true : (remainingCredits >= creditCost);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(t('createInvalidImageFile'));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError(t('createImageTooLarge'));
      return;
    }

    setSourceImageMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      setSourceImageBase64(base64Data);
      setSourcePreviewUrl(result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && toolMode !== 'enhance' && toolMode !== 'variation') {
      setError(t('createPromptRequired'));
      return;
    }

    if (requiresSourceImage && !sourceImageBase64) {
      setError(t('createSourceImageRequired'));
      return;
    }

    if (!hasEnoughCredits) {
      setError(t('createInsufficientCredits'));
      return;
    }

    setError(null);
    setIsGenerating(true);
    setGenerationJob(null);

    try {
      const response = await api.generateImage({
        tool: currentToolKey,
        prompt: prompt.trim() || 'Enhanced detailed composition',
        negativePrompt: negativePrompt.trim() || undefined,
        aspectRatio,
        resolution,
        style,
        sourceImageBase64: sourceImageBase64 || undefined,
        sourceImageMimeType: sourceImageBase64 ? sourceImageMimeType : undefined,
        strength: requiresSourceImage ? strength : undefined
      });

      const jobData = response.job || (response.generation ? {
        id: response.generation.id,
        userId: user?.id || 'dev_user',
        tool: currentToolKey as any,
        provider: response.generation.provider || 'gemini',
        status: 'COMPLETED' as const,
        inputMetadata: {
          prompt: response.generation.prompt || prompt,
          aspectRatio,
          resolution,
          style
        },
        outputMetadata: {
          assetUrl: response.generation.image || response.generation.assetUrl || response.assetUrl,
          mimeType: response.generation.mimeType || 'image/png'
        },
        usageCost: 0,
        retryCount: 0,
        createdAt: new Date().toISOString()
      } : response);

      setGenerationJob(jobData);
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Generation job encountered an error.');
      await refreshUser();
    } finally {
      setIsGenerating(false);
    }
  };

  const studioTitleKey = `createStudioTitle${toolMode.charAt(0).toUpperCase() + toolMode.slice(1)}`;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Development AI Test Mode Notice */}
      {isDevTest && (
        <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-xs text-indigo-950 dark:text-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-indigo-900 dark:text-indigo-100">
                {t('createDevModeNotice')}
              </p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                {t('createDevModeSub')}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/app/chat')}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition text-xs shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t('dashboardOpenChat')}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Studio Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {t(studioTitleKey)}
            </h1>
            <Badge variant="neutral" size="sm">Gemini Flash Image</Badge>
            {isDevTest && (
              <Badge variant="success" size="sm">{t('createDevTestActive')}</Badge>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {t('studioSubtitle')}
          </p>
        </div>

        {/* Credit Indicator */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
            <span>{t('createCostLabel')}: <strong>{isDevTest || isGuest ? 0 : creditCost}</strong> {creditCost > 1 ? t('createCredits') : t('createCredit')}</span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span className="text-zinc-500">
              {t('createBalanceLabel')}: <strong className="text-zinc-900 dark:text-zinc-100">{isDevTest ? t('devFree') : isGuest ? (language === 'fa' ? 'رایگان' : 'Free') : remainingCredits}</strong>
            </span>
          </div>
          {!isDevTest && !hasEnoughCredits && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/billing')}
            >
              {t('createUpgrade')}
            </Button>
          )}
        </div>
      </div>

      {/* Tool Navigation Pill selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => navigate('/create/image/text')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
            toolMode === 'text'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          {t('createPillTextToImage')}
        </button>
        <button
          onClick={() => navigate('/create/image/image')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
            toolMode === 'image'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          {t('createPillImageToImage')}
        </button>
        <button
          onClick={() => navigate('/create/image/variation')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
            toolMode === 'variation'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          {t('createPillVariation')}
        </button>
        <button
          onClick={() => navigate('/create/image/enhance')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
            toolMode === 'enhance'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          {t('createPillEnhance')}
        </button>
        <button
          onClick={() => navigate('/create/image/style')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
            toolMode === 'style'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          {t('createPillStyle')}
        </button>
      </div>

      {/* Main Studio Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Config Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Reference Image Uploader */}
          {requiresSourceImage && (
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{t('createRefImageRequired')}</span>
                </label>
                {sourcePreviewUrl && (
                  <button
                    onClick={() => {
                      setSourceImageBase64(null);
                      setSourcePreviewUrl(null);
                    }}
                    className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                  >
                    {t('createRemoveImage')}
                  </button>
                )}
              </div>

              {sourcePreviewUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 max-h-56 flex items-center justify-center">
                  <img
                    src={sourcePreviewUrl}
                    alt="Reference Preview"
                    referrerPolicy="no-referrer"
                    className="max-h-56 w-auto object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-6 text-center hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer bg-zinc-50/50 dark:bg-zinc-900/30"
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                >
                  <Upload className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    {t('createClickOrDrag')}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">{t('createFileFormats')}</p>
                  <input
                    id="file-upload-input"
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

              {toolMode === 'image' && (
                <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400">{t('transformationStrength')}:</span>
                    <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{strength}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.95"
                    step="0.05"
                    value={strength}
                    onChange={(e) => setStrength(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>{t('createSubtleVariation')}</span>
                    <span>{t('createHighTransformation')}</span>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Prompt Section */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5" />
                <span>{t('createPromptDescription')}</span>
              </label>
              <span className="text-[11px] text-zinc-400">{prompt.length} {t('createChars')}</span>
            </div>

            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('createPromptPlaceholder')}
              className="w-full p-3 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 leading-relaxed resize-none"
            />

            <div className="space-y-1.5">
              <span className="text-[11px] text-zinc-400 font-medium">{t('createInspirationPresets')}</span>
              <div className="flex flex-wrap gap-1.5">
                {samplePrompts.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(sample)}
                    className="text-[11px] px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 truncate max-w-xs text-left cursor-pointer transition-colors"
                    title={sample}
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Negative Prompt */}
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {t('createNegativePromptOptional')}
              </label>
              <span className="text-[11px] text-zinc-400">{t('createNegativePromptDesc')}</span>
            </div>
            <input
              type="text"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder={t('createNegativePlaceholder')}
              className="w-full h-9 px-3 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </Card>

          {/* Model Parameters */}
          <Card className="p-4 space-y-4">
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>{t('createGenerationParams')}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Aspect Ratio */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-600 dark:text-zinc-400">{t('createAspectRatio')}</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full h-9 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
                >
                  <option value="1:1">{t('createSquare')}</option>
                  <option value="16:9">{t('createLandscape')}</option>
                  <option value="9:16">{t('createStory')}</option>
                  <option value="4:3">{t('createEditorial')}</option>
                  <option value="3:4">{t('createPortrait')}</option>
                </select>
              </div>

              {/* Resolution */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-600 dark:text-zinc-400">{t('createTargetResolution')}</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full h-9 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
                >
                  <option value="1024x1024">{t('createStandard')}</option>
                  <option value="2048x2048">{t('createHigh2K')}</option>
                  <option value="4096x4096">{t('createUltra4K')}</option>
                </select>
              </div>

              {/* Style Preset */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-600 dark:text-zinc-400">{t('createAestheticStyle')}</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full h-9 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
                >
                  <option value="Photorealistic">{t('createPhotorealistic')}</option>
                  <option value="Cinematic">{t('createCinematic')}</option>
                  <option value="Digital Art">{t('createDigitalArt')}</option>
                  <option value="Anime">{t('createAnime')}</option>
                  <option value="3D Isometric">{t('create3DIso')}</option>
                  <option value="Minimalist Vector">{t('createMinimalistVector')}</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Error display */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t('createGenerationFailed')}</p>
                <p className="mt-0.5">{error}</p>
                <p className="text-[11px] text-zinc-500 mt-1">{t('createCreditsRefunded')}</p>
              </div>
            </div>
          )}

          {/* Action trigger button */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={handleGenerate}
              isLoading={isGenerating}
              disabled={!hasEnoughCredits}
              leftIcon={<Sparkles className="w-4 h-4" />}
              className="w-full shadow-md"
            >
              {isGenerating ? t('btnProcessing') : `${t('createGenerateMedia')} (${creditCost} ${creditCost > 1 ? t('createCredits') : t('createCredit')})`}
            </Button>
          </div>
        </div>

        {/* Right Output Preview Pane (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-4 min-h-[480px] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>{t('createOutputCanvas')}</span>
              </span>
              {generationJob?.status && (
                <Badge
                  variant={generationJob.status === 'COMPLETED' ? 'success' : 'neutral'}
                  size="sm"
                >
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
                      {t('createSynthesizing')}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {t('createGeneratingVia')}
                    </p>
                  </div>
                </div>
              ) : generationJob?.outputMetadata?.assetUrl ? (
                <div className="space-y-4 w-full text-center">
                  <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 max-h-[380px] flex items-center justify-center group">
                    <img
                      src={generationJob.outputMetadata.assetUrl}
                      alt="Generated Asset"
                      referrerPolicy="no-referrer"
                      className="max-h-[380px] w-auto object-contain rounded-lg"
                    />
                    <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPreviewModalOpen(true)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        {t('createInspectFullscreen')}
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 text-left text-xs space-y-1">
                    <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                      <span>{t('createAspectLabel')}</span>
                      <span className="font-mono text-zinc-900 dark:text-zinc-100">{generationJob.inputMetadata.aspectRatio}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                      <span>{t('createResolutionLabel')}</span>
                      <span className="font-mono text-zinc-900 dark:text-zinc-100">{generationJob.outputMetadata.width}x{generationJob.outputMetadata.height}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                      <span>{t('createFileSize')}</span>
                      <span className="font-mono text-zinc-900 dark:text-zinc-100">{Math.round((generationJob.outputMetadata.sizeBytes || 0) / 1024)} KB</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <a
                      href={generationJob.outputMetadata.assetUrl}
                      download={`firstmind-${generationJob.id}.png`}
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
                        {t('btnDownload')}
                      </Button>
                    </a>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => navigate('/history')}
                    >
                      {t('createHistory')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 space-y-2 text-zinc-400">
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mx-auto text-zinc-400">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{t('createCanvasReady')}</h4>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                    {t('createCanvasDesc')}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {previewModalOpen && generationJob?.outputMetadata?.assetUrl && (
        <Modal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          maxWidth="2xl"
          title={t('createPreviewTitle')}
          description={`${language === 'fa' ? 'شناسه کار' : 'Job ID'}: ${generationJob.id}`}
        >
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden bg-zinc-950 flex items-center justify-center max-h-[70vh]">
              <img
                src={generationJob.outputMetadata.assetUrl}
                alt="Fullscreen Preview"
                referrerPolicy="no-referrer"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              <strong>{t('createPromptLabel')}</strong> {generationJob.inputMetadata.prompt}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewModalOpen(false)}>
                {t('createClose')}
              </Button>
              <a
                href={generationJob.outputMetadata.assetUrl}
                download={`firstmind-${generationJob.id}.png`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="primary" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                  {t('createDownload')}
                </Button>
              </a>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
