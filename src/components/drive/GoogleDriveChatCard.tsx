import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Cloud, Folder, CheckCircle2, RefreshCw, ExternalLink, ShieldCheck, ChevronRight } from 'lucide-react';
import { GoogleDriveBackupView } from './GoogleDriveBackupView';

interface GoogleDriveChatCardProps {
  folderName?: string;
  initialOpen?: boolean;
}

export const GoogleDriveChatCard: React.FC<GoogleDriveChatCardProps> = ({
  folderName = 'Mayra',
  initialOpen = true
}) => {
  const [isExpanded, setIsExpanded] = useState(initialOpen);
  const [completedLink, setCompletedLink] = useState<string | null>(null);

  return (
    <div className="my-2 w-full max-w-md rounded-2xl overflow-hidden shadow-lg border border-purple-400/30 bg-[#160a2b]/95 backdrop-blur-xl">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 flex items-center justify-between cursor-pointer hover:bg-purple-900/80 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-purple-500/30 rounded-xl border border-purple-400/40 text-purple-200">
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Google Drive Sync: '{folderName}'</span>
              {completedLink && (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                  Completed
                </span>
              )}
            </div>
            <div className="text-[10px] text-purple-200/70">
              {completedLink ? 'सभी फाइलें ड्राइव में सेव हो चुकी हैं' : 'क्लिक करके ड्राइव बैकअप खोलें या नियंत्रित करें'}
            </div>
          </div>
        </div>

        <ChevronRight className={`w-4 h-4 text-purple-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </div>

      {isExpanded && (
        <div className="p-2.5">
          <GoogleDriveBackupView
            folderName={folderName}
            onBackupSuccess={(link) => {
              setCompletedLink(link);
            }}
          />
        </div>
      )}
    </div>
  );
};
