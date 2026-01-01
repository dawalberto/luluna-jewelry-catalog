import React, { useState } from 'react';
import { generateCatalogPDF, type PDFGeneratorOptions } from '../../utils/pdfGenerator';

interface DownloadPDFButtonProps {
  pdfOptions: Omit<PDFGeneratorOptions, 'onProgress'>;
}

export const DownloadPDFButton: React.FC<DownloadPDFButtonProps> = ({ pdfOptions }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });

  const handleDownload = async () => {
    if (isGenerating) return;

    try {
      setIsGenerating(true);
      setProgress({ loaded: 0, total: pdfOptions.products.length });

      await generateCatalogPDF({
        ...pdfOptions,
        onProgress: (loaded, total) => {
          setProgress({ loaded, total });
        },
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert(
        pdfOptions.locale === 'es'
          ? 'Error al generar el PDF. Por favor, inténtalo de nuevo.'
          : 'Failed to generate PDF. Please try again.'
      );
    } finally {
      setIsGenerating(false);
      setProgress({ loaded: 0, total: 0 });
    }
  };

  const buttonText = pdfOptions.locale === 'es' ? 'Descargar catálogo' : 'Download catalog';
  const loadingText = pdfOptions.locale === 'es' ? 'Generando...' : 'Generating...';

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className="fixed bottom-6 left-6 z-30 group"
      aria-label={buttonText}
    >
      {/* Button container with glass effect */}
      <div
        className={`
          flex items-center gap-3 px-5 py-3.5 
          bg-white/95 backdrop-blur-sm
          border border-(--color-primary)/20
          shadow-lg shadow-(--color-primary)/10
          transition-all duration-300 ease-out
          ${isGenerating ? 'opacity-75 cursor-wait' : 'hover:shadow-xl hover:shadow-(--color-primary)/20 hover:scale-105 cursor-pointer'}
        `}
        style={{
          borderRadius: '12px',
        }}
      >
        {/* Icon */}
        <div className="relative w-5 h-5 shrink-0">
          {isGenerating ? (
            // Loading spinner
            <svg
              className="animate-spin w-5 h-5"
              style={{ color: 'var(--color-primary)' }}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            // Download icon
            <svg
              className="w-5 h-5 transition-transform group-hover:translate-y-0.5"
              style={{ color: 'var(--color-primary)' }}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
          )}
        </div>

        {/* Text */}
        <div className="flex flex-col items-start">
          <span
            className="text-sm font-medium leading-tight"
            style={{
              color: 'var(--color-text)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {isGenerating ? loadingText : buttonText}
          </span>
          
          {/* Progress indicator */}
          {isGenerating && progress.total > 0 && (
            <span
              className="text-xs leading-tight mt-0.5"
              style={{ color: 'var(--color-muted)' }}
            >
              {progress.loaded} / {progress.total}
            </span>
          )}
        </div>
      </div>

      {/* Tooltip on hover */}
      {!isGenerating && (
        <div
          className="
            absolute left-full ml-3 top-1/2 -translate-y-1/2
            px-3 py-1.5 bg-(--color-text) text-white text-xs
            opacity-0 group-hover:opacity-100
            pointer-events-none transition-opacity duration-200
            whitespace-nowrap
          "
          style={{
            borderRadius: '6px',
            fontFamily: 'var(--font-body)',
          }}
        >
          {pdfOptions.locale === 'es'
            ? 'Descarga los productos visibles en PDF'
            : 'Download visible products as PDF'}
          
          {/* Arrow */}
          <div
            className="absolute right-full top-1/2 -translate-y-1/2"
            style={{
              width: 0,
              height: 0,
              borderTop: '4px solid transparent',
              borderBottom: '4px solid transparent',
              borderRight: '4px solid var(--color-text)',
            }}
          />
        </div>
      )}
    </button>
  );
};
