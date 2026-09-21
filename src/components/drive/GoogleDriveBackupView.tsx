import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, CheckCircle2, AlertCircle, RefreshCw, Folder, FileText, 
  ExternalLink, Upload, Plus, Trash2, ShieldCheck, ArrowRight,
  LogOut, Check, FileCheck, HardDrive, FileJson, Info
} from 'lucide-react';
import { GoogleSignInButton } from '../auth/GoogleSignInButton';
import { 
  GoogleDriveService, 
  DriveBackupProgress, 
  AppFileToBackup 
} from '../../services/drive/googleDriveService';
import { User } from 'firebase/auth';

interface GoogleDriveBackupViewProps {
  onClose?: () => void;
  autoStartBackup?: boolean;
  folderName?: string;
  onBackupSuccess?: (folderLink: string, fileCount: number) => void;
  className?: string;
}

export const GoogleDriveBackupView: React.FC<GoogleDriveBackupViewProps> = ({
  onClose,
  autoStartBackup = false,
  folderName = 'Mayra',
  onBackupSuccess,
  className = ''
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [filesToBackup, setFilesToBackup] = useState<AppFileToBackup[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [backupProgress, setBackupProgress] = useState<DriveBackupProgress | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Subscribe to Google Drive service auth state
  useEffect(() => {
    const driveService = GoogleDriveService.getInstance();
    const unsubscribe = driveService.subscribeAuth((user, token) => {
      setCurrentUser(user);
      setAccessToken(token);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Load available files for backup
  const loadFiles = useCallback(async () => {
    setIsLoadingFiles(true);
    try {
      const driveService = GoogleDriveService.getInstance();
      const files = await driveService.collectAllFiles();
      setFilesToBackup(files);
    } catch (e: any) {
      console.warn('[GoogleDriveBackupView] Error loading files:', e);
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Handle Google Sign In
  const handleSignIn = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const driveService = GoogleDriveService.getInstance();
      await driveService.signIn();
    } catch (err: any) {
      console.error('[GoogleDriveBackupView] Sign-in failed:', err);
      setAuthError(err?.message || 'Google Drive sign-in failed. Please try again.');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      const driveService = GoogleDriveService.getInstance();
      await driveService.signOut();
      setBackupProgress(null);
    } catch (e) {}
  };

  // Add custom file from user device
  const handleAddLocalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const newFiles: AppFileToBackup[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const content = await file.text();
        newFiles.push({
          name: file.name,
          category: 'User Added File',
          description: `Device upload (${Math.round(file.size / 1024)} KB)`,
          content,
          mimeType: file.type || 'text/plain',
          size: file.size
        });
      } catch (err) {
        console.warn('Could not read file text:', file.name);
      }
    }

    setFilesToBackup(prev => [...newFiles, ...prev]);
    e.target.value = '';
  };

  // Remove a file from the upload list
  const handleRemoveFile = (fileName: string) => {
    setFilesToBackup(prev => prev.filter(f => f.name !== fileName));
  };

  // Execute backup after confirmation
  const handleExecuteBackup = async () => {
    setShowConfirmModal(false);
    setIsBackingUp(true);
    try {
      const driveService = GoogleDriveService.getInstance();
      const result = await driveService.backupAllFiles(
        folderName,
        filesToBackup,
        (progress) => {
          setBackupProgress({ ...progress });
        }
      );

      if (result.status === 'completed') {
        onBackupSuccess?.(result.folderLink || '', result.completedFiles);
      }
    } catch (err: any) {
      console.error('[GoogleDriveBackupView] Backup failed:', err);
    } finally {
      setIsBackingUp(false);
    }
  };

  // Trigger auto-start if requested and authenticated
  useEffect(() => {
    if (autoStartBackup && currentUser && accessToken && filesToBackup.length > 0 && !isBackingUp && !backupProgress) {
      setShowConfirmModal(true);
    }
  }, [autoStartBackup, currentUser, accessToken, filesToBackup.length, isBackingUp, backupProgress]);

  const totalBytes = filesToBackup.reduce((acc, f) => acc + (f.size || 0), 0);
  const formattedSize = totalBytes > 1024 * 1024 
    ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB` 
    : `${Math.round(totalBytes / 1024)} KB`;

  return (
    <div className={`p-4 bg-[#140b27]/80 backdrop-blur-3xl border border-white/15 rounded-3xl space-y-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)] ${className}`}>
      
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-500/20 text-purple-300 rounded-2xl border border-purple-400/30 shadow-inner">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-sans font-bold text-white flex items-center gap-2">
              <span>Google Drive Backup</span>
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-200 border border-purple-400/30 text-[10px] rounded-full font-mono font-normal">
                Folder: {folderName}
              </span>
            </h3>
            <p className="text-[11px] text-purple-200/70 font-sans">
              सभी फाइलों को आपके Google Drive में '{folderName}' फ़ोल्डर में सुरक्षित रूप से सेव करें
            </p>
          </div>
        </div>

        {currentUser && (
          <button
            onClick={handleSignOut}
            className="text-[11px] text-purple-300 hover:text-white flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
            title="Disconnect Google Drive"
          >
            <LogOut className="w-3.5 h-3.5" /> Disconnect
          </button>
        )}
      </div>

      {/* Auth state card */}
      {!currentUser || !accessToken ? (
        <div className="p-4 bg-[#1b0d36]/70 border border-purple-400/30 rounded-2xl space-y-3 text-center">
          <div className="w-12 h-12 mx-auto bg-purple-500/15 rounded-full flex items-center justify-center border border-purple-400/30 text-purple-300">
            <Cloud className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white font-sans">Google Drive से कनेक्ट करें</h4>
            <p className="text-[11px] text-purple-200/80 max-w-sm mx-auto leading-relaxed">
              आपकी अनुमति से Mayra आपकी सभी फाइलों (Living Profile, Projects, Memories, Notes) को आपके Google Drive में <strong>'{folderName}'</strong> फ़ोल्डर में सुरक्षित रूप से सेव करेगी।
            </p>
          </div>

          {authError && (
            <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-[11px] flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <div className="pt-2 flex justify-center">
            <GoogleSignInButton
              onClick={handleSignIn}
              isLoading={isLoadingAuth}
              label="Sign in with Google to Connect Drive"
            />
          </div>
        </div>
      ) : (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 text-xs font-bold">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="User" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                currentUser.email?.slice(0, 2).toUpperCase() || 'GD'
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{currentUser.displayName || currentUser.email}</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">Connected</span>
              </div>
              <div className="text-[10px] text-purple-200/70 font-mono">{currentUser.email}</div>
            </div>
          </div>

          <div className="text-right text-[10px] text-purple-200/70">
            Destination: <span className="font-bold text-white">Google Drive / {folderName}</span>
          </div>
        </div>
      )}

      {/* File inventory list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5 text-purple-300" />
            <span>Files to Save in '{folderName}' Folder</span>
            <span className="text-[10px] text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full font-mono">
              {filesToBackup.length} files • {formattedSize}
            </span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={loadFiles}
              disabled={isLoadingFiles || isBackingUp}
              className="p-1 text-purple-300 hover:text-white rounded transition-colors"
              title="Refresh files"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
            </button>

            <label className="text-[10px] bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white px-2.5 py-1 rounded-xl cursor-pointer flex items-center gap-1 transition-colors border border-white/10">
              <Plus className="w-3 h-3" />
              <span>Add File</span>
              <input
                type="file"
                multiple
                onChange={handleAddLocalFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Files container */}
        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
          {isLoadingFiles ? (
            <div className="p-4 text-center text-xs text-purple-300/70 animate-pulse">
              Scanning user files, notes & memories...
            </div>
          ) : filesToBackup.length === 0 ? (
            <div className="p-4 text-center text-xs text-purple-300/70 border border-dashed border-white/10 rounded-2xl">
              No files found to save. Tap "+ Add File" to upload any file from your device.
            </div>
          ) : (
            filesToBackup.map((file) => {
              const currentStatus = backupProgress?.uploadedFiles.find(u => u.name === file.name)?.status;
              const currentLink = backupProgress?.uploadedFiles.find(u => u.name === file.name)?.webViewLink;

              return (
                <div
                  key={file.name}
                  className="p-2.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 rounded-xl flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {file.name.endsWith('.json') ? (
                      <FileJson className="w-4 h-4 text-cyan-300 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-purple-300 shrink-0" />
                    )}
                    <div className="overflow-hidden">
                      <div className="text-white font-medium truncate max-w-[200px] sm:max-w-[260px] text-[11px]">
                        {file.name}
                      </div>
                      <div className="text-[9px] text-purple-300/60 truncate flex items-center gap-1.5">
                        <span className="text-purple-300 font-mono">{file.category}</span>
                        <span>•</span>
                        <span>{file.size ? `${Math.round(file.size / 1024 * 10) / 10} KB` : 'Text'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {currentStatus === 'completed' ? (
                      <a
                        href={currentLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Saved</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : currentStatus === 'uploading' ? (
                      <span className="text-purple-300 text-[10px] flex items-center gap-1 font-mono">
                        <RefreshCw className="w-3 h-3 animate-spin text-purple-400" /> Uploading
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRemoveFile(file.name)}
                        disabled={isBackingUp}
                        className="text-purple-300/40 hover:text-rose-400 p-1 transition-colors"
                        title="Remove from list"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Progress status banner if active */}
      {backupProgress && (
        <div className={`p-3 rounded-2xl border ${
          backupProgress.status === 'completed'
            ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200'
            : backupProgress.status === 'error'
            ? 'bg-rose-500/15 border-rose-400/30 text-rose-200'
            : 'bg-purple-500/15 border-purple-400/30 text-purple-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="flex items-center gap-1.5">
              {backupProgress.status === 'completed' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : backupProgress.status === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              ) : (
                <RefreshCw className="w-4 h-4 text-purple-300 animate-spin" />
              )}
              <span>
                {backupProgress.status === 'creating_folder' && `Google Drive में '${folderName}' फ़ोल्डर तैयार किया जा रहा है...`}
                {backupProgress.status === 'uploading' && `अपलोड प्रगति: ${backupProgress.completedFiles} / ${backupProgress.totalFiles}`}
                {backupProgress.status === 'completed' && `सफलतापूर्वक सेव हो गया! सभी ${backupProgress.completedFiles} फाइलें '${folderName}' में सुरक्षित हैं.`}
                {backupProgress.status === 'error' && (backupProgress.errorMessage || 'अपलोड में त्रुटि हुई')}
              </span>
            </span>

            <span className="font-mono text-[11px]">
              {Math.round((backupProgress.completedFiles / (backupProgress.totalFiles || 1)) * 100)}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                backupProgress.status === 'completed' ? 'bg-emerald-400' : 'bg-purple-400'
              }`}
              style={{
                width: `${(backupProgress.completedFiles / (backupProgress.totalFiles || 1)) * 100}%`
              }}
            />
          </div>

          {backupProgress.folderLink && (
            <div className="pt-2 flex justify-end">
              <a
                href={backupProgress.folderLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-xl border border-white/20 transition-all shadow-sm"
              >
                <span>Google Drive में '{folderName}' फ़ोल्डर खोलें</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Action button */}
      {currentUser && accessToken && (
        <div className="pt-1">
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isBackingUp || filesToBackup.length === 0}
            className="w-full py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-sans font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_8px_24px_rgba(147,51,234,0.4)] hover:shadow-[0_12px_28px_rgba(147,51,234,0.6)] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isBackingUp ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Google Drive में सेव हो रहा है...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>मेरी सभी {filesToBackup.length} फ़ाइलें ड्राइव में '{folderName}' नाम से सेव करें</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Mandatory User Confirmation Dialog (Workspace Integration Safety Standard) */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#160a2b] border border-purple-400/40 rounded-3xl p-5 space-y-4 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-white text-xs"
            >
              <div className="flex items-center gap-2.5 text-purple-300">
                <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-400/30">
                  <ShieldCheck className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Google Drive में सेव करने की पुष्टि</h4>
                  <p className="text-[10px] text-purple-300/70">User Permission Confirmation</p>
                </div>
              </div>

              <div className="p-3 bg-white/[0.05] border border-white/10 rounded-2xl space-y-2 text-[11px] text-purple-200/90 leading-relaxed">
                <p>
                  क्या आप अपनी <strong>{filesToBackup.length} फाइलों</strong> को अपने Google Drive (<strong>{currentUser?.email}</strong>) में <strong>'{folderName}'</strong> नाम के फ़ोल्डर में सहेजना (save) चाहते हैं?
                </p>
                <div className="text-[10px] text-purple-300/60 font-mono">
                  • फ़ोल्डर: Drive &gt; {folderName}<br />
                  • कुल आकार: {formattedSize}<br />
                  • फ़ाइलें: Living Profile, Projects, Daily Notes, Memories, Backups
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-purple-200 rounded-xl font-medium transition-colors"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  onClick={handleExecuteBackup}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/50 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>हाँ, सेव करें (Confirm)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
