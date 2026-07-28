import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, RefreshCw, AlertCircle } from 'lucide-react';
import { Language } from '../types';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  lang: Language;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  lang,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = 'camera-barcode-reader-region';

  const [manualCode, setManualCode] = useState<string>('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setLastScanned(manualCode.trim());
    onScan(manualCode.trim());
    setManualCode('');
  };

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsInitializing(true);
    setErrorMsg(null);

    const startScanner = async () => {
      try {
        // Wait for DOM element
        await new Promise((resolve) => setTimeout(resolve, 300));
        if (!isMounted) return;

        const html5Qrcode = new Html5Qrcode(qrCodeRegionId);
        html5QrcodeRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 180 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (isMounted) {
              setLastScanned(decodedText);
              onScan(decodedText);
            }
          },
          () => {
            // ignore frame parse errors
          }
        );

        if (isMounted) {
          setIsInitializing(false);
        }
      } catch (err: any) {
        console.error('Camera barcode scanner error:', err);
        if (isMounted) {
          setIsInitializing(false);
          setErrorMsg(
            lang === 'ku'
              ? 'تکایە لە مۆڵەتەکانی وێبگەڕ ڕێگە بە کامێرا بدە یان کۆدەکە بە دەست بنووسە لە خوارەوە.'
              : 'Please allow camera permission in your browser or type the barcode manually below.'
          );
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (html5QrcodeRef.current) {
        html5QrcodeRef.current
          .stop()
          .then(() => {
            html5QrcodeRef.current?.clear();
            html5QrcodeRef.current = null;
          })
          .catch(() => {
            html5QrcodeRef.current = null;
          });
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="liquid-glass rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-white/80 flex flex-col items-center">
        <div className="flex items-center justify-between w-full border-b border-slate-200/60 pb-3">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              {lang === 'ku' ? 'سکێنەری کامێرا بۆ بارکۆد' : 'Camera Barcode Scanner'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-white/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera View Area */}
        <div className="w-full relative bg-slate-900 rounded-2xl overflow-hidden min-h-[280px] flex items-center justify-center border border-white/20 shadow-inner">
          <div id={qrCodeRegionId} className="w-full h-full" />

          {/* Animated Scan Bar Overlay */}
          {!errorMsg && !isInitializing && (
            <div className="absolute inset-x-8 top-12 bottom-12 border-2 border-amber-400/80 rounded-2xl pointer-events-none flex flex-col justify-between overflow-hidden shadow-lg shadow-amber-500/20">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />
              <div className="bg-amber-500/10 text-amber-300 text-[10px] font-mono font-bold text-center py-1 backdrop-blur-xs">
                {lang === 'ku' ? 'بارکۆدەکە لە ناوچەی ڕەنگ زەردەکە دابنێ' : 'Align barcode within frame'}
              </div>
            </div>
          )}

          {isInitializing && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-xs font-medium">
                {lang === 'ku' ? 'داگیرساندنی کامێرا...' : 'Starting camera...'}
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-6 text-center text-rose-300 text-xs space-y-2">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <p>{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Manual Barcode Fallback Input */}
        <form onSubmit={handleManualSubmit} className="w-full flex gap-2 pt-1">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder={
              lang === 'ku'
                ? 'کۆد یان بارکۆد بە دەست بنووسە...'
                : 'Enter code or barcode manually...'
            }
            className="flex-1 bg-white/60 border border-white/80 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
          />
          <button
            type="submit"
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
          >
            {lang === 'ku' ? 'زیاکردن' : 'Add'}
          </button>
        </form>

        {lastScanned && (
          <div className="w-full p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-xs font-mono font-bold text-emerald-700">
            {lang === 'ku' ? 'دوا بارکۆدی خوێنراوەوە:' : 'Last scanned:'} {lastScanned}
          </div>
        )}

        <div className="w-full flex justify-end pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition shadow-md active:scale-95 cursor-pointer"
          >
            {lang === 'ku' ? 'داخستن' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
