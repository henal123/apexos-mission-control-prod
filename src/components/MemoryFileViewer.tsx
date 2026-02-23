'use client';

import { useState, useEffect } from 'react';
import { MemoryFile } from '@/types';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  Search,
  FileCode,
  FileJson,
  Save,
  X,
} from 'lucide-react';

// Mock memory tree data
const mockMemoryTree: MemoryFile[] = [
  {
    path: '/workspace/apexos',
    name: 'apexos',
    type: 'directory',
    lastModified: new Date().toISOString(),
    children: [
      {
        path: '/workspace/apexos/SOUL.md',
        name: 'SOUL.md',
        type: 'file',
        content: '# SOUL.md\n\n## Agent Identity\n\nThis is the core identity file for ApexOS agents.\n\n### Purpose\n- Define agent capabilities\n- Establish communication protocols\n- Document core values\n\n### Last Updated\n2024-01-15',
        lastModified: new Date().toISOString(),
      },
      {
        path: '/workspace/apexos/MEMORY.md',
        name: 'MEMORY.md',
        type: 'file',
        content: '# MEMORY.md\n\n## Long-term Memory\n\n### Key Decisions\n1. Adopted microservices architecture\n2. Implemented WebSocket for real-time updates\n3. Chose PostgreSQL for primary database\n\n### Learnings\n- Caching reduces latency by 60%\n- Batch processing improves throughput\n\n### Relationships\n- Atlas: Systems Architect\n- Velocity: Performance Engineer\n- Monarch: Project Manager\n- Growth: Business Development\n- Nova: CTO',
        lastModified: new Date().toISOString(),
      },
      {
        path: '/workspace/apexos/HEARTBEAT.md',
        name: 'HEARTBEAT.md',
        type: 'file',
        content: '# HEARTBEAT.md\n\n## Agent Status\n\n### Atlas\n- Status: Online\n- Current Task: Database optimization\n- Last Active: 2 minutes ago\n\n### Velocity\n- Status: Busy\n- Current Task: Load testing\n- Last Active: 5 minutes ago\n\n### Monarch\n- Status: Online\n- Current Task: Sprint planning\n- Last Active: 1 minute ago\n\n### Growth\n- Status: Offline\n- Last Active: 2 hours ago\n\n### Nova\n- Status: Online\n- Current Task: Building Mission Control\n- Last Active: Just now',
        lastModified: new Date().toISOString(),
      },
    ],
  },
];

interface FileTreeNodeProps {
  file: MemoryFile;
  level: number;
  onSelect: (file: MemoryFile) => void;
  selectedPath?: string;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
}

function FileTreeNode({
  file,
  level,
  onSelect,
  selectedPath,
  expandedPaths,
  onToggleExpand,
}: FileTreeNodeProps) {
  const isExpanded = expandedPaths.has(file.path);
  const isSelected = selectedPath === file.path;
  const hasChildren = file.children && file.children.length > 0;

  const getFileIcon = () => {
    if (file.type === 'directory') {
      return isExpanded ? (
        <FolderOpen className="h-4 w-4 text-cyan-400" />
      ) : (
        <Folder className="h-4 w-4 text-cyan-400" />
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'md':
        return <FileText className="h-4 w-4 text-blue-400" />;
      case 'json':
        return <FileJson className="h-4 w-4 text-yellow-400" />;
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        return <FileCode className="h-4 w-4 text-green-400" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
          isSelected
            ? 'bg-cyan-500/20 text-cyan-400'
            : 'hover:bg-slate-800 text-slate-300'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => {
          if (file.type === 'directory') {
            onToggleExpand(file.path);
          } else {
            onSelect(file);
          }
        }}
      >
        {file.type === 'directory' && (
          <span className="text-slate-500">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </span>
        )}
        {getFileIcon()}
        <span className={cn('text-sm truncate', isSelected && 'font-medium')}>
          {file.name}
        </span>
      </div>

      {/* Render children if expanded */}
      {file.type === 'directory' && isExpanded && file.children && (
        <div>
          {file.children.map((child) => (
            <FileTreeNode
              key={child.path}
              file={child}
              level={level + 1}
              onSelect={onSelect}
              selectedPath={selectedPath}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MemoryFileViewer() {
  const { memoryTree, selectedFile, selectFile, updateFileContent, setMemoryTree } = useStore();
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['/workspace/apexos']));
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  // Initialize mock data
  useEffect(() => {
    if (memoryTree.length === 0) {
      setMemoryTree(mockMemoryTree);
    }
  }, [memoryTree.length, setMemoryTree]);

  const toggleExpand = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFileSelect = (file: MemoryFile) => {
    selectFile(file);
    setIsEditing(false);
    setEditContent(file.content || '');
  };

  const handleSave = () => {
    if (selectedFile) {
      updateFileContent(selectedFile.path, editContent);
      setIsEditing(false);
    }
  };

  const filteredTree = searchQuery
    ? filterTree(memoryTree, searchQuery.toLowerCase())
    : memoryTree;

  return (
    <div className="flex h-full gap-4">
      {/* File Tree Sidebar */}
      <Card className="w-80 flex-shrink-0 bg-slate-900/50 border-slate-800 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-cyan-400" />
            <h3 className="font-semibold text-white">Memory Files</h3>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-auto py-0">
          <div className="space-y-0.5">
            {filteredTree.map((file) => (
              <FileTreeNode
                key={file.path}
                file={file}
                level={0}
                onSelect={handleFileSelect}
                selectedPath={selectedFile?.path}
                expandedPaths={expandedPaths}
                onToggleExpand={toggleExpand}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* File Content Viewer */}
      <Card className="flex-1 bg-slate-900/50 border-slate-800 flex flex-col">
        {selectedFile ? (
          <>
            <CardHeader className="border-b border-slate-800 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-cyan-400" />
                  <div>
                    <h3 className="font-semibold text-white">{selectedFile.name}</h3>
                    <p className="text-xs text-slate-500">{selectedFile.path}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                        className="text-slate-400"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        className="bg-cyan-600 hover:bg-cyan-700"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(true);
                        setEditContent(selectedFile.content || '');
                      }}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[calc(100vh-300px)]">
                {isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-full min-h-[400px] bg-slate-950 text-slate-300 p-4 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    spellCheck={false}
                  />
                ) : (
                  <div className="p-4">
                    {selectedFile.content ? (
                      <pre className="font-mono text-sm text-slate-300 whitespace-pre-wrap">
                        {selectedFile.content}
                      </pre>
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-500">No content available</p>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <Folder className="h-16 w-16 text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-400 mb-2">No File Selected</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Select a file from the sidebar to view its contents
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// Helper function for filtering tree
function filterTree(tree: MemoryFile[], query: string): MemoryFile[] {
  return tree
    .map((node) => {
      if (node.name.toLowerCase().includes(query)) {
        return node;
      }
      if (node.children) {
        const filteredChildren = filterTree(node.children, query);
        if (filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
      }
      return null;
    })
    .filter(Boolean) as MemoryFile[];
}
