import React from 'react';
import { 
  Wand2, 
  ImageIcon, 
  Layers, 
  Sparkles, 
  Palette, 
  Video, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

interface FeaturesViewProps {
  navigate: (path: string) => void;
}

export const FeaturesView: React.FC<FeaturesViewProps> = ({ navigate }) => {
  const { t, language } = useLanguage();

  const tools = [
    {
      id: 'text-to-image',
      nameKey: 'featureTextToImageName',
      icon: Wand2,
      tagKey: 'featureTextToImageTag',
      costKey: 'featureTextToImageCost',
      descKey: 'featureTextToImageDesc',
      specs: [
        'featureTextToImageSpec1',
        'featureTextToImageSpec2',
        'featureTextToImageSpec3',
        'featureTextToImageSpec4'
      ],
      path: '/create/image/text'
    },
    {
      id: 'image-to-image',
      nameKey: 'featureImageToImageName',
      icon: ImageIcon,
      tagKey: 'featureImageToImageTag',
      costKey: 'featureImageToImageCost',
      descKey: 'featureImageToImageDesc',
      specs: [
        'featureImageToImageSpec1',
        'featureImageToImageSpec2',
        'featureImageToImageSpec3',
        'featureImageToImageSpec4'
      ],
      path: '/create/image/image'
    },
    {
      id: 'variation',
      nameKey: 'featureVariationName',
      icon: Layers,
      tagKey: 'featureVariationTag',
      costKey: 'featureVariationCost',
      descKey: 'featureVariationDesc',
      specs: [
        'featureVariationSpec1',
        'featureVariationSpec2',
        'featureVariationSpec3'
      ],
      path: '/create/image/variation'
    },
    {
      id: 'enhance',
      nameKey: 'featureEnhanceName',
      icon: Sparkles,
      tagKey: 'featureEnhanceTag',
      costKey: 'featureEnhanceCost',
      descKey: 'featureEnhanceDesc',
      specs: [
        'featureEnhanceSpec1',
        'featureEnhanceSpec2',
        'featureEnhanceSpec3'
      ],
      path: '/create/image/enhance'
    },
    {
      id: 'style-transfer',
      nameKey: 'featureStyleName',
      icon: Palette,
      tagKey: 'featureStyleTag',
      costKey: 'featureStyleCost',
      descKey: 'featureStyleDesc',
      specs: [
        'featureStyleSpec1',
        'featureStyleSpec2',
        'featureStyleSpec3'
      ],
      path: '/create/image/style'
    },
    {
      id: 'video',
      nameKey: 'featureVideoName',
      icon: Video,
      tagKey: 'featureVideoTag',
      costKey: 'featureVideoCost',
      descKey: 'featureVideoDesc',
      specs: [
        'featureVideoSpec1',
        'featureVideoSpec2',
        'featureVideoSpec3'
      ],
      path: '/create/video/text'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <Badge variant="neutral" size="md">{t('featuresBadge')}</Badge>
        <h1 className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-zinc-100">
          {t('featuresTitle')}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t('featuresDesc')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card key={tool.id} className="p-6 flex flex-col justify-between" hoverEffect>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="neutral" size="sm">{t(tool.costKey)}</Badge>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t(tool.nameKey)}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{t(tool.descKey)}</p>
                </div>

                <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {language === 'fa' ? 'قابلیت‌های کلیدی:' : 'Key Capabilities:'}
                  </span>
                  <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    {tool.specs.map((specKey, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{t(specKey)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(tool.path)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full"
                >
                  {t('launchTool')} {t(tool.nameKey)}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
