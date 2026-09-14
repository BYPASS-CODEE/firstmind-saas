import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Filter, 
  Download, 
  Trash2, 
  RotateCcw, 
  Eye, 
  Sparkles, 
  Video, 
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { GenerationJob } from '../../types';

interface HistoryViewProps {
  navigate: (path: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ navigate }) => {
  const { t, formatDate, language } = useLanguage();
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<GenerationJob | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [statusFilter, typeFilter]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const res = await api.getGenerations({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        limit: 50
      });
      setJobs(res.items || []);
    } catch (err: any) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      setActionError(null);
      await api.retryGeneration(id);
      loadHistory();
    } catch (err: any) {
      setActionError(err.message || t('historyRetryFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('historyConfirmDelete'))) return;
    try {
      setActionError(null);
      await api.deleteGeneration(id);
      if (selectedJob?.id === id) setSelectedJob(null);
      loadHistory();
    } catch (err: any) {
      setActionError(err.message || t('historyDeleteFailed'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {t('historyTitle')}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {t('historyDesc')}
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 cursor-pointer"
          >
            <option value="">{t('historyAllMedia')}</option>
            <option value="IMAGE">{t('historyImagesOnly')}</option>
            <option value="VIDEO">{t('historyVideosOnly')}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 cursor-pointer"
          >
            <option value="">{t('historyAllStatuses')}</option>
            <option value="COMPLETED">{t('historyCompleted')}</option>
            <option value="PROCESSING">{t('historyProcessing')}</option>
            <option value="FAILED">{t('historyFailed')}</option>
          </select>
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Archive Grid / List */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 animate-spin mx-auto" />
          <p className="text-xs text-zinc-400">{t('historyLoading')}</p>
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-6 h-6" />}
          title={t('emptyGenerationsTitle', 'No generations yet.')}
          description={t('emptyGenerationsDesc', 'Create your first digital artwork or video sequence using our neural creative engines.')}
          actionLabel={t('historyLaunchStudio')}
          onAction={() => navigate('/create/image/text')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {jobs.map((job) => {
            const isVideo = job.tool.includes('VIDEO');
            const hasAsset = Boolean(job.outputMetadata?.assetUrl);

            return (
              <Card key={job.id} className="overflow-hidden flex flex-col justify-between" hoverEffect>
                <div>
                  {/* Asset visual preview */}
                  <div className="relative aspect-square bg-zinc-950 flex items-center justify-center group overflow-hidden">
                    {hasAsset ? (
                      isVideo ? (
                        <video
                          src={job.outputMetadata!.assetUrl}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={job.outputMetadata!.assetUrl}
                          alt="Asset"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )
                    ) : (
                      <div className="text-center p-4 space-y-2 text-zinc-600">
                        {isVideo ? <Video className="w-8 h-8 mx-auto" /> : <ImageIcon className="w-8 h-8 mx-auto" />}
                        <p className="text-xs">{job.status === 'FAILED' ? 'Generation Failed' : 'Processing...'}</p>
                      </div>
                    )}

                    <div className="absolute top-2 left-2">
                      <Badge
                        variant={
                          job.status === 'COMPLETED' ? 'success' :
                          job.status === 'FAILED' ? 'error' : 'neutral'
                        }
                        size="sm"
                      >
                        {job.status}
                      </Badge>
                    </div>

                    <div className="absolute top-2 right-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900/80 text-white backdrop-blur-xs">
                        {job.inputMetadata.aspectRatio || '1:1'}
                      </span>
                    </div>

                    {/* Hover Overlay */}
                    {hasAsset && (
                      <div className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedJob(job)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          {t('historyInspect')}
                        </Button>
                        <a
                          href={job.outputMetadata!.assetUrl}
                          download={`firstmind-${job.id}.${isVideo ? 'mp4' : 'png'}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                            <Button size="sm" variant="primary" leftIcon={<Download className="w-3.5 h-3.5" />}>
                              {t('historyGet')}
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Metadata info */}
                  <div className="p-3.5 space-y-2">
                    <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
                      {job.inputMetadata.prompt || t('historySynthesizedAsset')}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                      <span>{job.tool}</span>
                      <span>{formatDate(job.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/40">
                  <div className="text-[11px] font-mono text-zinc-500">
                    <span className="font-mono text-[11px] text-zinc-500">
                      {t('historyCost')}: {job.usageCost} cr
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {job.status === 'FAILED' && (
                      <button
                        onClick={() => handleRetry(job.id)}
                        className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                        title={t('historyRetry')}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer"
                      title={t('historyDeleteAsset')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Asset Detail Modal */}
      {selectedJob && (
        <Modal
          isOpen={Boolean(selectedJob)}
          onClose={() => setSelectedJob(null)}
          maxWidth="2xl"
          title={t('historyModalTitle')}
          description={`Job ID: ${selectedJob.id}`}
        >
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden bg-zinc-950 flex items-center justify-center max-h-[60vh]">
              {selectedJob.tool.includes('VIDEO') ? (
                <video
                  src={selectedJob.outputMetadata?.assetUrl}
                  controls
                  autoPlay
                  loop
                  className="max-h-[60vh] w-auto object-contain"
                />
              ) : (
                <img
                  src={selectedJob.outputMetadata?.assetUrl}
                  alt="Asset Preview"
                  referrerPolicy="no-referrer"
                  className="max-h-[60vh] w-auto object-contain"
                />
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 space-y-1 text-zinc-700 dark:text-zinc-300">
                <p><strong>{t('historyPrompt')}</strong> {selectedJob.inputMetadata.prompt}</p>
                {selectedJob.inputMetadata.negativePrompt && (
                  <p><strong>{t('historyNegative')}</strong> {selectedJob.inputMetadata.negativePrompt}</p>
                )}
                <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-zinc-500">
                  <div>{t('historyTool')} <span className="font-mono text-zinc-800 dark:text-zinc-200">{selectedJob.tool}</span></div>
                  <div>{t('historyRatio')} <span className="font-mono text-zinc-800 dark:text-zinc-200">{selectedJob.inputMetadata.aspectRatio}</span></div>
                  <div>{t('historyResolution')} <span className="font-mono text-zinc-800 dark:text-zinc-200">{selectedJob.outputMetadata?.width}x{selectedJob.outputMetadata?.height}</span></div>
                  <div>{t('historyCreated')} <span className="font-mono text-zinc-800 dark:text-zinc-200">{formatDate(selectedJob.createdAt)}</span></div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(selectedJob.id)}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                {t('historyDelete')}
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedJob(null)}>
                  {t('historyClose')}
                </Button>
                {selectedJob.outputMetadata?.assetUrl && (
                  <a
                    href={selectedJob.outputMetadata.assetUrl}
                    download={`firstmind-${selectedJob.id}.${selectedJob.tool.includes('VIDEO') ? 'mp4' : 'png'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="primary" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
                      {t('historyDownloadOriginal')}
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
