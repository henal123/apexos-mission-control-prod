'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Edit3, Folder, FileText, Info } from 'lucide-react';
import { cn, readFile } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  path: string;
}

interface MemoryFileEditorProps {
  role: string;
}

// Demo files structure
const DEMO_FILES: Record<string, FileItem[]> = {
  'CEO': [
    { name: 'AGENTS.md', type: 'file', path: '/workspace/CEO/AGENTS.md' },
    { name: 'SOUL.md', type: 'file', path: '/workspace/CEO/SOUL.md' },
    { name: 'memory/', type: 'directory', path: '/workspace/CEO/memory' },
  ],
  'CTO': [
    { name: 'AGENTS.md', type: 'file', path: '/workspace/CTO/AGENTS.md' },
    { name: 'TECH_STACK.md', type: 'file', path: '/workspace/CTO/TECH_STACK.md' },
    { name: 'memory/', type: 'directory', path: '/workspace/CTO/memory' },
  ],
  'COO': [
    { name: 'AGENTS.md', type: 'file', path: '/workspace/COO/AGENTS.md' },
    { name: 'memory/', type: 'directory', path: '/workspace/COO/memory' },
  ],
  'CMO': [
    { name: 'AGENTS.md', type: 'file', path: '/workspace/CMO/AGENTS.md' },
    { name: 'memory/', type: 'directory', path: '/workspace/CMO/memory' },
  ],
  'CRO': [
    { name: 'AGENTS.md', type: 'file', path: '/workspace/CRO/AGENTS.md' },
    { name: 'memory/', type: 'directory', path: '/workspace/CRO/memory' },
  ],
  'CGO': [
    { name: 'AGENTS.md', type: 'file', path: '/workspace/CGO/AGENTS.md' },
    { name: 'memory/', type: 'directory', path: '/workspace/CGO/memory' },
  ],
};

export function MemoryFileEditor({ role }: MemoryFileEditorProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Demo file listing only
    const roleFiles = DEMO_FILES[role] || [
      { name: 'AGENTS.md', type: 'file', path: `/workspace/${role}/AGENTS.md` },
      { name: 'memory/', type: 'directory', path: `/workspace/${role}/memory` },
    ];
    setFiles(roleFiles);
  }, [role]);

  const loadFile = async (file: FileItem) => {
    if (file.type === 'directory') return;
    
    setLoading(true);
    toast({
      title: 'Static Export Mode',
      description: 'File editing requires backend API. Connect via OpenClaw CLI for full access.',
    });
    setSelectedFile(file);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-amber-400">Static Export Mode</h3>
          <p className="text-sm text-amber-300/80 mt-1">
            File operations require a backend API. This is a read-only demo view.
            <br />
            For full file editing, use the OpenClaw CLI or connect to a live gateway.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* File Tree */}
        <Card className="lg:col-span-1 bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm">Files</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => loadFile(file)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors",
                    selectedFile?.path === file.path
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "text-slate-300 hover:bg-slate-800"
                  )}
                >
                  {file.type === 'directory' ? (
                    <Folder className="h-4 w-4 text-slate-500" />
                  ) : (
                    <FileText className="h-4 w-4 text-slate-500" />
                  )}
                  <span className="truncate">{file.name}</span>
                </button>
              ))}
              
              {files.length === 0 && !loading && (
                <div className="text-center text-slate-500 py-8">
                  No files found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* View Only */}
        <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-slate-400" />
                <CardTitle className="text-white text-sm">{selectedFile ? selectedFile.name : 'File Viewer'}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {selectedFile ? (
              <div className="bg-slate-950 border border-slate-800 rounded-md p-4 min-h-[300px]">
                <p className="text-slate-400 text-sm">
                  Path: {selectedFile.path}
                </p>
                <div className="mt-4 p-4 bg-slate-900/50 rounded text-slate-500 text-sm">
                  <p>File content would appear here in live mode.</p>
                  <p className="mt-2">
                    Connect to an OpenClaw gateway via <code>Connection Settings → Test Connection</code>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] border border-dashed border-slate-700 rounded-md">
                <div className="text-center text-slate-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Select a file to view</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
