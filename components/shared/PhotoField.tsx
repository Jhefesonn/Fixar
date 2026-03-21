'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';

interface PhotoFieldProps {
    value: string;
    onUpload: (url: string) => void;
    folder: string;
    label: string;
    aspect?: number;
    shape?: 'round' | 'rect';
    icon?: string;
}

export interface PhotoFieldHandle {
    openCamera: () => void;
    openGallery: () => void;
}

const PhotoField = React.forwardRef<PhotoFieldHandle, PhotoFieldProps>(({ 
    value, 
    onUpload, 
    folder, 
    label, 
    aspect = 1, 
    shape = 'rect',
    icon = 'photo_camera'
}, ref) => {
    const [uploading, setUploading] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);
    
    // Multiple input refs for "Take Photo" vs "Gallery"
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => ({
        openCamera: () => cameraInputRef.current?.click(),
        openGallery: () => galleryInputRef.current?.click()
    }));

    const onCropComplete = useCallback((_extended: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob | null> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        ctx.drawImage(
            image,
            pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
            0, 0, pixelCrop.width, pixelCrop.height
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result as string);
                setShowCropper(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const handleConfirmCrop = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        setUploading(true);
        setShowCropper(false);
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (!croppedBlob) throw new Error('Falha ao processar imagem.');
            
            const fileName = `${folder}-${Date.now()}.jpg`;
            const filePath = `${folder}/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, croppedBlob, { contentType: 'image/jpeg', upsert: true });
            
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            onUpload(publicUrl);
        } catch (error: any) {
            console.error('Error processing photo:', error);
            alert('Erro ao carregar foto: ' + error.message);
        } finally {
            setUploading(false);
            setImageSrc(null);
        }
    };

    const renderMainUI = () => {
        if (!value && !uploading) return null;

        return (
            <div className={`flex flex-col items-center justify-center gap-6 py-10 bg-navy-950/30 rounded-[40px] border border-slate-800/50 relative overflow-hidden group/photo w-full transition-all duration-500`}>
                {/* Background glow */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-primary-600/10 blur-[80px] rounded-full group-hover/photo:bg-primary-600/20 transition-all duration-700`} />
                
                <div className="relative z-10 w-full px-6 flex flex-col items-center">
                    <div className={`mx-auto ${aspect === 1 ? 'aspect-square w-40 md:w-44 rounded-[40px]' : 'aspect-video w-full max-w-[16rem] rounded-3xl'} border-4 border-slate-800 overflow-hidden bg-navy-900 flex items-center justify-center shadow-2xl relative group/img-container hover:border-primary-600/30 transition-all duration-500 animate-fade-in`}>
                        {value && <img src={value} alt={label} className="h-full w-full object-cover" />}
                        
                        {/* Hover Overlay */}
                        {!uploading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover/img-container:opacity-100 transition-all duration-300 backdrop-blur-[2px] gap-3">
                                <button 
                                    type="button"
                                    onClick={() => cameraInputRef.current?.click()}
                                    className="h-12 w-12 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-lg transform translate-y-4 group-hover/img-container:translate-y-0 transition-all duration-500"
                                    title="Tirar Foto"
                                >
                                    <span className="material-symbols-outlined text-xl">photo_camera</span>
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => galleryInputRef.current?.click()}
                                    className="h-10 w-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-lg transform translate-y-4 group-hover/img-container:translate-y-0 transition-all duration-500 delay-75"
                                    title="Escolher da Galeria"
                                >
                                    <span className="material-symbols-outlined text-xl">image</span>
                                </button>
                            </div>
                        )}

                        {uploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                <div className="h-10 w-10 border-[3px] border-primary-600/20 border-t-primary-600 rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                    
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-6 animate-fade-in">{label}</p>
                    
                    {/* Mobile Specific Buttons (Visible below the preview when having a photo) */}
                    <div className="flex items-center justify-center gap-3 mt-4 md:hidden animate-fade-in">
                        <button 
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-navy-900 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">photo_camera</span>
                            Trocar
                        </button>
                        <button 
                            type="button"
                            onClick={() => galleryInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-navy-900 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">image</span>
                            Galeria
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {renderMainUI()}

            {/* Hidden Inputs */}
            <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                capture="environment" 
                ref={cameraInputRef}
                onChange={handleFileChange} 
                disabled={uploading} 
            />
            <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                ref={galleryInputRef}
                onChange={handleFileChange} 
                disabled={uploading} 
            />

            {/* Cropper Modal */}
            {showCropper && imageSrc && mounted && createPortal(
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in p-6">
                    <div className="w-full max-w-2xl bg-navy-900 border border-slate-800 rounded-[40px] overflow-hidden shadow-2xl flex flex-col h-[85vh] scale-in">
                        <div className="p-8 border-b border-slate-800/50 flex items-center justify-between bg-navy-950/50 text-left">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary-600/10 flex items-center justify-center text-primary-600">
                                    <span className="material-symbols-outlined">crop</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">Ajustar Imagem</h3>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Recorte para o formato ideal</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowCropper(false); setImageSrc(null); }} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-slate-800 text-slate-400 transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex-1 relative bg-black/50">
                            <Cropper 
                                image={imageSrc} 
                                crop={crop} 
                                zoom={zoom} 
                                aspect={aspect} 
                                cropShape={shape === 'round' ? 'round' : 'rect'}
                                onCropChange={setCrop} 
                                onCropComplete={onCropComplete} 
                                onZoomChange={setZoom} 
                            />
                        </div>
                        <div className="p-10 border-t border-slate-800/50 bg-navy-950/50">
                            <div className="flex flex-col gap-8">
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Zoom</span>
                                        <span className="text-sm font-black text-white">{Math.round(zoom * 100)}%</span>
                                    </div>
                                    <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary-600" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button type="button" onClick={() => { setShowCropper(false); setImageSrc(null); }} className="py-5 rounded-2xl border border-slate-800 text-slate-400 text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Cancelar</button>
                                    <button type="button" onClick={handleConfirmCrop} className="py-5 rounded-2xl bg-primary-600 text-white text-sm font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all shadow-xl">Confirmar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
});

PhotoField.displayName = 'PhotoField';

export default PhotoField;
