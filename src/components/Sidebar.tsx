'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  MessageSquare, 
  FolderOpen, 
  Zap,
  Terminal,
  Settings,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { 
    name: 'Dashboard', 
    href: '/', 
    icon: LayoutDashboard,
    description: 'Monitor system status'
  },
  { 
    name: 'Agents', 
    href: '/agents', 
    icon: Users,
    description: 'Manage active agents'
  },
  { 
    name: 'Sessions', 
    href: '/sessions', 
    icon: Terminal,
    description: 'View agent sessions'
  },
  { 
    name: 'Tasks', 
    href: '/kanban', 
    icon: Zap,
    description: 'Task board'
  },
  { 
    name: 'Files', 
    href: '/files', 
    icon: FolderOpen,
    description: 'Memory files'
  },
  { 
    name: 'Cron', 
    href: '/cron', 
    icon: Calendar,
    description: 'Scheduled jobs'
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<{ connected: boolean; url: string }>({ 
    connected: false, 
    url: 'ws://127.0.0.1:18789' 
  });

  // Check gateway status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/openclaw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'gateway-status' }),
        });
        const data = await res.json();
        setGatewayStatus({
          connected: data.connected,
          url: data.url || 'ws://127.0.0.1:18789'
        });
      } catch (err) {
        setGatewayStatus(prev => ({ ...prev, connected: false }));
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-white">ApexOS</h1>
              <p className="text-xs text-slate-500">Mission Control</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group relative",
                isActive 
                  ? "bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0", collapsed && "mx-auto")} />
              {!collapsed && (
                <span className="font-medium text-sm">{item.name}</span>
              )}
              
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 rounded text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-slate-800" />

      {/* Footer - Connection Status */}
      <div className="p-4 space-y-3">
        {/* Gateway Connection */}
        <div className={cn(
          "p-3 rounded-lg border",
          gatewayStatus.connected 
            ? "bg-green-500/10 border-green-500/30" 
            : "bg-red-500/10 border-red-500/30"
        )}>
          <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
            {gatewayStatus.connected ? (
              <Wifi className="h-4 w-4 text-green-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-400" />
            )}
            {!collapsed && (
              <div className="text-xs">
                <p className={cn(
                  "font-medium",
                  gatewayStatus.connected ? "text-green-400" : "text-red-400"
                )}>
                  {gatewayStatus.connected ? 'CONNECTED' : 'DISCONNECTED'}
                </p>
                <p className="text-slate-500 truncate max-w-[150px]">
                  {gatewayStatus.url}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-slate-400 hover:text-white"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs">Collapse</span>
            </div>
          )}
        </Button>

        {!collapsed && (
          <p className="text-xs text-slate-600 text-center">
            REAL DATA MODE
          </p>
        )}
      </div>
    </aside>
  );
}
