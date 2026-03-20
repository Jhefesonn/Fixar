'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeButtonProps {
    onScan: (decodedText: string) => void;
    title?: string;
    subtitle?: string;
}

export default function BarcodeButton({ 
    onScan, 
    title = "Leitor de Código", 
    subtitle = "Aponte a câmera para o código de barras" 
}: BarcodeButtonProps) {
    const [showScanner, setShowScanner] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scannerId = "shared-barcode-reader";

    const startScanner = async () => {
        setShowScanner(true);
        // Delay to ensure DOM element is ready
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode(scannerId);
                scannerRef.current = html5QrCode;
                const config = { 
                    fps: 10, 
                    qrbox: { width: 250, height: 150 },
                    aspectRatio: 1.0
                };
                
                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        onScan(decodedText);
                        stopScanner();
                    },
                    undefined
                );
            } catch (err) {
                console.error("Erro ao iniciar scanner:", err);
            }
        }, 300);
    };

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
            } catch (err) {
                console.error("Erro ao parar scanner:", err);
            }
        }
        setShowScanner(false);
    };

    // Auto-stop on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop();
            }
        };
    }, []);

    return (
        <>
            <button 
                type="button" 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl bg-primary-600/10 text-primary-600 hover:bg-primary-600 hover:text-white transition-all flex items-center justify-center group/scan-btn"
                title="Abrir Scanner"
                onClick={startScanner}
            >
                <span className="material-symbols-outlined text-xl group-hover/scan-btn:scale-110 transition-transform">barcode_scanner</span>
            </button>

            {showScanner && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in p-6">
                    <div className="w-full max-w-xl bg-navy-900 border border-slate-800 rounded-[40px] overflow-hidden shadow-2xl flex flex-col scale-in">
                        <div className="p-8 border-b border-slate-800/50 flex items-center justify-between bg-navy-950/50 text-left">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary-600/10 flex items-center justify-center text-primary-600">
                                    <span className="material-symbols-outlined">barcode_scanner</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">{title}</h3>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{subtitle}</p>
                                </div>
                            </div>
                            <button onClick={stopScanner} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-slate-800 text-slate-400 transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="p-4 bg-black relative aspect-square sm:aspect-video flex items-center justify-center">
                            <div id={scannerId} className="w-full h-full overflow-hidden rounded-2xl"></div>
                            
                            {/* Overlay visual do scanner */}
                            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-primary-600 shadow-[0_0_15px_rgba(37,99,235,0.8)] animate-scan-line pointer-events-none"></div>
                            
                            {/* Corner Borders */}
                            <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-primary-600 rounded-tl-lg"></div>
                            <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-primary-600 rounded-tr-lg"></div>
                            <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-primary-600 rounded-bl-lg"></div>
                            <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-primary-600 rounded-br-lg"></div>
                        </div>

                        <div className="p-10 bg-navy-950/50 text-center">
                            <p className="text-slate-400 text-xs mb-6">Se a leitura falhar, você pode digitar o número diretamente no campo de texto.</p>
                            <button 
                                onClick={stopScanner} 
                                className="w-full py-5 rounded-2xl border border-slate-800 text-slate-400 text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                            >
                                Cancelar e Digitar Manualmente
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <style jsx>{`
                @keyframes scan-line {
                    0%, 100% { transform: translateY(-150%); opacity: 0; }
                    50% { transform: translateY(0); opacity: 1; }
                    51% { transform: translateY(0); opacity: 1; }
                    100% { transform: translateY(150%); opacity: 0; }
                }
                .animate-scan-line {
                    animation: scan-line 3s ease-in-out infinite;
                }
            `}</style>
        </>
    );
}
