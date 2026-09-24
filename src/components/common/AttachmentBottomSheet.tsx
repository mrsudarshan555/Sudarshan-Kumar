import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, FileText, Sparkles, Music2, PanelsTopLeft, Search, GraduationCap, UserRound } from 'lucide-react';

export interface AttachmentItem {
  type: 'photo' | 'gallery' | 'file';
  name: string;
  size: string;
  dataUrl?: string;
  mimeType?: string;
  file?: File;
}

interface AttachmentBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAttachment: (attachment: AttachmentItem) => void;
  onOpenVisionScanner?: () => void;
  onToolPrompt?: (prompt: string) => void;
}

export const AttachmentBottomSheet: React.FC<AttachmentBottomSheetProps> = ({
  isOpen, onClose, onSelectAttachment, onOpenVisionScanner, onToolPrompt
}) => {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = (file: File, type: 'photo' | 'gallery' | 'file') => {
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`;
    const detectedMime = file.type || 'application/octet-stream';
    const reader = new FileReader();
    reader.onload = (ev) => onSelectAttachment({
      type, name: file.name || `File_${Date.now()}`, size: sizeStr,
      dataUrl: ev.target?.result as string, mimeType: detectedMime, file
    });
    reader.readAsDataURL(file);
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Multiple is enabled so Android's native photo picker can show its multi-select grid.
    // MAYRA's current transport accepts one image payload, so the first selected image is attached.
    if (files[0]) processFile(files[0], 'gallery');
    e.target.value = '';
    onClose();
  };

  const handleFileBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file, 'file');
    e.target.value = '';
    onClose();
  };

  const runTool = (prompt: string) => {
    onClose();
    onToolPrompt?.(prompt);
  };

  const chip = (label: string, Icon: React.ElementType, onClick: () => void) => (
    <button type="button" onClick={onClick}
      className="min-w-[86px] h-[94px] px-3 rounded-[27px] bg-[#151515] border border-white/[0.035] flex flex-col items-center justify-center gap-2 text-white/90 active:scale-[0.98] transition-transform">
      <Icon className="w-6 h-6" strokeWidth={1.65} />
      <span className="text-[14px] font-medium">{label}</span>
    </button>
  );

  const row = (label: string, Icon: React.ElementType, onClick: () => void, badge?: string) => (
    <button type="button" onClick={onClick}
      className="w-full h-[58px] px-2 flex items-center gap-4 text-left text-white/90 active:bg-white/[0.06] rounded-xl">
      <Icon className="w-[24px] h-[24px]" strokeWidth={1.7} />
      <span className="text-[15px] font-medium">{label}</span>
      {badge && <span className="ml-1 px-2 py-0.5 rounded-full bg-white/10 text-[11px] text-white/75">{badge}</span>}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-[2px] animate-in fade-in select-none">
      <div className="absolute inset-0" onClick={onClose} />
      <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGallerySelect} />
      <input ref={fileInputRef} type="file" accept="*/*" className="hidden" onChange={handleFileBrowse} />

      <div className="relative z-10 w-full max-w-md bg-[#1b1b1b] border-t border-white/[0.07] rounded-t-[30px] px-4 pt-2 pb-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="w-14 h-1.5 rounded-full bg-white/45 mx-auto mb-3" />

        <div className="overflow-x-auto scrollbar-none">
          <div className="flex gap-2 min-w-max">
            {chip('Camera', Camera, () => { onClose(); onOpenVisionScanner?.(); })}
            {chip('Photos', ImageIcon, () => galleryInputRef.current?.click())}
            {chip('Files', FileText, () => fileInputRef.current?.click())}
            {chip('Avatar', UserRound, () => runTool('Open MAYRA avatar and character options.'))}
          </div>
        </div>

        <div className="mt-3">
          {row('Create image', Sparkles, () => runTool('Create an image for me.'))}
          {row('Create music', Music2, () => runTool('Help me create music.'))}
          {row('Canvas', PanelsTopLeft, () => runTool('Open a canvas workspace for this task.'))}
          {row('Deep Research', Search, () => runTool('Do a deep research workflow for my request and give me a sourced answer.'))}
          {row('Guided Learning', GraduationCap, () => runTool('Start guided learning mode for my request.'))}
          {row('Personal Intelligence', UserRound, () => runTool('Use my available personal context to personalize this request.'), 'Labs')}
        </div>
      </div>
    </div>
  );
};
