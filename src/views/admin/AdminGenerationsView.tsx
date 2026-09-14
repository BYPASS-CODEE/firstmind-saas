import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Video, 
  Image as ImageIcon, 
  Download, 
  Eye, 
  RefreshCw, 
  RotateCcw,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { GenerationJob } from '../../types';

export const AdminGenerationsView: React.FC = () => {
  const { formatDate } = useLanguage();
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [toolFilter, setToolFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<GenerationJob | null>(null);

  useEffect(() => {
    loadJobs();
  }, [statusFilter, toolFilter]);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminGenerations({
        status: statusFilter || undefined,
        tool: toolFilter || undefined,
        limit: 50
      });
      setJobs(res.generations || []);
    } catch (err) {
      console.error('Failed to load admin generations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Platform Generations Telemetry
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Global view of all AI synthesis jobs, model latencies, error stacks, and usage accounting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={toolFilter}
            onChange={(e) => setToolFilter(e.target.value)}
            className="h-9 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          >
            <option value="">All Tools</option>
            <option value="TEXT_TO_IMAGE">Text to Image</option>
            <option value="IMAGE_TO_IMAGE">Image to Image</option>
            <option value="VARIATION">Variation</option>
            <option value="ENHANCE">Enhance</option>
            <option value="STYLE_TRANSFER">Style Transfer</option>
            <option value="TEXT_TO_VIDEO">Veo Video</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-2.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PROCESSING">Processing</option>
            <option value="FAILED">Failed</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={loadJobs}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Job ID</th>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Tool</th>
              <th className="py-3 px-4">Prompt</th>
              <th className="py-3 px-4">Cost</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Created</th>
              <th className="py-3 px-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
            {jobs.map((j) => (
              <tr key={j.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                <td className="py-3 px-4 font-mono text-[11px] text-zinc-500">
                  {j.id.slice(0, 8)}
                </td>
                <td className="py-3 px-4 font-mono text-[11px]">
                  {j.userId.slice(0, 8)}
                </td>
                <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                  {j.tool}
                </td>
                <td className="py-3 px-4 max-w-xs truncate">
                  {j.inputMetadata?.prompt || 'No prompt text'}
                </td>
                <td className="py-3 px-4 font-mono">{j.usageCost} cr</td>
                <td className="py-3 px-4">
                  <Badge
                    variant={j.status === 'COMPLETED' ? 'success' : j.status === 'FAILED' ? 'error' : 'neutral'}
                    size="sm"
                  >
                    {j.status}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-zinc-400">{formatDate(j.createdAt)}</td>
                <td className="py-3 px-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedJob(j)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedJob && (
        <Modal
          isOpen={Boolean(selectedJob)}
          onClose={() => setSelectedJob(null)}
          maxWidth="xl"
          title="Admin Job Diagnostics"
          description={`Full raw trace for Job ID: ${selectedJob.id}`}
        >
          <div className="space-y-4 text-xs">
            {selectedJob.outputMetadata?.assetUrl && (
              <div className="max-h-56 bg-zinc-950 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src={selectedJob.outputMetadata.assetUrl}
                  alt="Asset"
                  referrerPolicy="no-referrer"
                  className="max-h-56 object-contain"
                />
              </div>
            )}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg font-mono text-[11px] space-y-1">
              <div>User ID: {selectedJob.userId}</div>
              <div>Status: {selectedJob.status}</div>
              <div>Tool: {selectedJob.tool}</div>
              <div>Usage Cost: {selectedJob.usageCost} Credits</div>
              <div>Prompt: {selectedJob.inputMetadata?.prompt}</div>
              {(selectedJob.errorMessage || selectedJob.error) && (
                <div className="text-rose-500">Error: {selectedJob.errorMessage || selectedJob.error}</div>
              )}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedJob(null)}>
                Close Diagnostics
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
