import React, { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle2, X, Share, Monitor, FileDown, ArrowDown } from 'lucide-react';
import { Language } from '../types';
import { exportToSingleHtmlFile } from '../utils/singleHtmlExporter';

interface PwaInstallButtonProps {
  lang: Language;
}

export const PwaInstallButton: React.FC<PwaInstallButtonProps> = ({ lang }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is already installed/standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(iosDevice);

    // Listen for chromium beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = () => {
    setShowInstallModal(true);
  };

  const handleTriggerDirectPrompt = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowInstallModal(false);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div
        className="hidden sm:flex items-center space-x-1.5 space-x-reverse bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-500/30 backdrop-blur-md"
        title={lang === 'ku' ? 'ئەپەکە وەک PWA دامەزراوە' : 'App installed as PWA'}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden md:inline">{lang === 'ku' ? 'ئەپەکە وەک PWA ئامادەیە' : 'PWA Ready'}</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center space-x-1.5 space-x-reverse bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white px-3.5 py-1.5 rounded-full text-xs font-extrabold transition shadow-md shadow-emerald-500/25 border border-emerald-300/30 active:scale-95 cursor-pointer animate-pulse"
        title={lang === 'ku' ? 'داگرتنی ئەپ لەسەر مۆبایل و کۆمپیوتەر (PWA)' : 'Install App (PWA)'}
      >
        <Download className="w-3.5 h-3.5 text-white" />
        <span className="hidden sm:inline">
          {lang === 'ku' ? 'داگرتنی ئەپ (PWA)' : 'Install App'}
        </span>
      </button>

      {/* Main Installation Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-700/80 text-right text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">
                    {lang === 'ku' ? 'داگرتن و دامەزراندنی سیستەم' : 'Install & Download App'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'ku' ? 'بۆ بەکارهێنانی ئۆفلاین لەسەر مۆبایل و کۆمپیوتەر' : 'For offline usage on phone & desktop'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct PWA Install Prompt Button (if browser prompt is ready) */}
            {deferredPrompt && (
              <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/30 border border-emerald-500/40 p-4 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 space-x-reverse text-emerald-400 font-extrabold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{lang === 'ku' ? 'وێبگەڕەکەت ئامادەیە بۆ دامەزراندن!' : 'Direct installation ready!'}</span>
                </div>
                <button
                  onClick={handleTriggerDirectPrompt}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition cursor-pointer flex items-center justify-center space-x-2 space-x-reverse"
                >
                  <Download className="w-4 h-4" />
                  <span>{lang === 'ku' ? 'دامەزراندنی ڕاستەوخۆ (PWA Install)' : 'Install Now (PWA)'}</span>
                </button>
              </div>
            )}

            {/* Download Standalone Single HTML Option */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center space-x-1.5 space-x-reverse">
                  <FileDown className="w-4 h-4" />
                  <span>{lang === 'ku' ? 'داگرتنی فایلی تاکی ئۆفلاین' : 'Download Offline Single File'}</span>
                </span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-mono border border-amber-500/20">
                  HTML Bundle
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {lang === 'ku'
                  ? 'دەتوانیت هەموو سیستەمەکە وەک یەک فایلی ئۆفلاین دابگریت و بەبێ ئینتەرنێت لەسەر هەر مۆبایلێک یان کۆمپیوتەرێک بیکەیتەوە.'
                  : 'Download the entire standalone system into a single offline HTML file that works on any device.'}
              </p>
              <button
                onClick={() => {
                  exportToSingleHtmlFile();
                  setShowInstallModal(false);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center space-x-2 space-x-reverse"
              >
                <Download className="w-4 h-4" />
                <span>{lang === 'ku' ? 'داگرتنی فایلی HTML' : 'Download Standalone File (.html)'}</span>
              </button>
            </div>

            {/* Manual PWA Guides */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-1.5 space-x-reverse">
                <Monitor className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'ku' ? 'ڕێنمایی دامەزراندن وەک ئەپ لەسەر شاشە (PWA)' : 'PWA Installation Instructions'}</span>
              </h4>

              {/* Android / Chrome / Windows Guide */}
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 space-y-2 text-xs text-slate-300">
                <div className="flex items-center space-x-2 space-x-reverse font-bold text-white">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'ku' ? 'ئەندرۆید / کۆمپیوتەر (Chrome / Edge)' : 'Android / PC (Chrome / Edge)'}</span>
                </div>
                <ol className="space-y-1.5 text-[11px] text-slate-400 list-decimal list-inside pr-1">
                  <li>{lang === 'ku' ? 'سێ خاڵەکەی سەرەوەی وێبگەڕەکەت (Menu ⋮) داگرە.' : 'Click the 3 dots menu (⋮) in your browser.'}</li>
                  <li>{lang === 'ku' ? 'دگمەی "Install app" یان "Add to Home Screen" هەڵبژێرە.' : 'Select "Install app" or "Add to Home Screen".'}</li>
                  <li>{lang === 'ku' ? 'کرتە لەسەر Install بکە بۆ ئەوەی بێتە سەر شاشە.' : 'Click Install to finish.'}</li>
                </ol>
              </div>

              {/* iOS Guide */}
              {isIos && (
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center space-x-2 space-x-reverse font-bold text-white">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    <span>{lang === 'ku' ? 'ئایفۆن و ئایپاد (iPhone / Safari)' : 'iPhone / iPad (Safari)'}</span>
                  </div>
                  <ol className="space-y-1.5 text-[11px] text-slate-400 list-decimal list-inside pr-1">
                    <li className="flex items-center space-x-1.5 space-x-reverse">
                      <span>{lang === 'ku' ? 'لە خوارەوە دگمەی هاوبەشکردن داگرە:' : 'Tap the Share icon:'}</span>
                      <Share className="w-3.5 h-3.5 text-sky-400 inline" />
                    </li>
                    <li>{lang === 'ku' ? 'هەڵبژاردنی "Add to Home Screen".' : 'Select "Add to Home Screen".'}</li>
                    <li>{lang === 'ku' ? 'دگمەی Add لە سەرەوە داگرە.' : 'Tap Add in the top right corner.'}</li>
                  </ol>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {lang === 'ku' ? 'داخستن' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

