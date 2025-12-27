import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n';
import { SiteContentService } from '../../services';
import type { SiteContent } from '../../types';
import { Button, Input } from '../ui';

const siteContentService = new SiteContentService();

export default function HomePanel() {
  const { t } = useI18n();
  const [siteContent, setSiteContent] = useState<SiteContent>({
    catalogTitle: { es: '', en: '' },
    catalogSubtitle: { es: '', en: '' },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const content = await siteContentService.getSiteContent();
        if (mounted) setSiteContent(content);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await siteContentService.setSiteContent(siteContent);
      alert((t.admin as any).homeSaved || 'Cambios guardados exitosamente');
    } catch (err) {
      alert((t.admin as any).homeSaveError || 'Error al guardar los cambios');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-squircle shadow-md p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-2">{(t.admin as any).homeTitle || 'Configuración de inicio'}</h2>
      <p className="text-sm text-gray-600 mb-4">{(t.admin as any).homeHelp || 'Personaliza el texto que aparece en la página del catálogo.'}</p>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">{(t.admin as any).catalogTitle || 'Título del catálogo'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="text"
            label={(t.admin as any).catalogTitleEs || 'Título (Español)'}
            value={siteContent.catalogTitle.es}
            onChange={(e) =>
              setSiteContent((prev) => ({
                ...prev,
                catalogTitle: { ...prev.catalogTitle, es: e.target.value },
              }))
            }
            disabled={loading || saving}
            placeholder="Catálogo Luluna"
          />
          <Input
            type="text"
            label={(t.admin as any).catalogTitleEn || 'Título (Inglés)'}
            value={siteContent.catalogTitle.en}
            onChange={(e) =>
              setSiteContent((prev) => ({
                ...prev,
                catalogTitle: { ...prev.catalogTitle, en: e.target.value },
              }))
            }
            disabled={loading || saving}
            placeholder="Luluna Catalog"
          />
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">{(t.admin as any).catalogSubtitle || 'Subtítulo del catálogo'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          type="text"
          label={(t.admin as any).catalogSubtitleEs || 'Subtítulo (Español)'}
          value={siteContent.catalogSubtitle.es}
          onChange={(e) =>
            setSiteContent((prev) => ({
              ...prev,
              catalogSubtitle: { ...prev.catalogSubtitle, es: e.target.value },
            }))
          }
          disabled={loading || saving}
          placeholder="Joyería artesanal única y elegante"
        />
        <Input
          type="text"
          label={(t.admin as any).catalogSubtitleEn || 'Subtítulo (Inglés)'}
          value={siteContent.catalogSubtitle.en}
          onChange={(e) =>
            setSiteContent((prev) => ({
              ...prev,
              catalogSubtitle: { ...prev.catalogSubtitle, en: e.target.value },
            }))
          }
          disabled={loading || saving}
          placeholder="Unique and elegant handcrafted jewelry"
        />
      </div>
      </div>

      <div className="mt-4">
        <Button onClick={handleSave} disabled={loading || saving}>
          {(t.admin as any).homeSave || 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
}
