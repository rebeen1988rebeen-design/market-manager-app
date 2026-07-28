import React from 'react';
import { FileCode } from 'lucide-react';
import { Language } from '../types';
import { exportToSingleHtmlFile } from '../utils/singleHtmlExporter';

interface DownloadHtmlButtonProps {
  lang: Language;
}

export const DownloadHtmlButton: React.FC<DownloadHtmlButtonProps> = ({ lang }) => {
  const handleDownload = () => {
    exportToSingleHtmlFile();
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center space-x-1.5 space-x-reverse bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white px-3.5 py-1.5 rounded-full text-xs font-extrabold transition shadow-md shadow-blue-500/25 border border-blue-400/30 active:scale-95 cursor-pointer"
      title={
        lang === 'ku'
          ? 'داگرتنی گشت کۆدەکە وەک فایلی تاکی HTML'
          : 'Download complete code as single HTML file'
      }
    >
      <FileCode className="w-3.5 h-3.5 text-blue-200" />
      <span className="hidden lg:inline">
        {lang === 'ku' ? 'داگرتنی HTML' : 'Download HTML'}
      </span>
    </button>
  );
};
