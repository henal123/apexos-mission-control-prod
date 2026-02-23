import { Agent, AGENT_ROLES } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusIndicator, AgentStatusBadge } from './StatusIndicator';
import { 
  Server, 
  Zap, 
  Crown, 
  TrendingUp, 
  Sparkles, 
  MessageSquare, 
  FileText,
  MoreHorizontal,
  Clock,
  Building2,
  Target,
  Rocket
} from 'lucide-react';
import { formatRelativeTime, truncateText } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

const roleIcons: Record<string, any> = {
  CEO: Building2,
  COO: Zap,
  CMO: Crown,
  CRO: TrendingUp,
  CTO: Sparkles,
  CGO: Target,
  Atlas: Server,
  Velocity: Zap,
  Monarch: Crown,
  Growth: TrendingUp,
  Nova: Sparkles,
};

const roleColors: Record<string, string> = {
  CEO: '#3b82f6',
  COO: '#f59e0b',
  CMO: '#8b5cf6',
  CRO: '#10b981',
  CTO: '#ec4899',
  CGO: '#06b6d4',
  Atlas: '#3b82f6',
  Velocity: '#f59e0b',
  Monarch: '#8b5cf6',
  Growth: '#10b981',
  Nova: '#ec4899',
};

interface AgentCardProps {
  agent: Agent;
  compact?: boolean;
  onMessage?: (agent: Agent) => void;
  onViewMemory?: (agent: Agent) => void;
}

export function AgentCard({ agent, compact = false, onMessage, onViewMemory }: AgentCardProps) {
  const RoleIcon = roleIcons[agent.role] || Sparkles;
  const roleColor = roleColors[agent.role] || '#64748b';

  if (compact) {
    return (
      <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${roleColor}20` }}
              >
                <RoleIcon className="h-5 w-5" style={{ color: roleColor }} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5">
                <StatusIndicator status={agent.status} size="sm" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-white truncate">{agent.name}</p>
              <p className="text-xs text-slate-400 truncate">{agent.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div 
                className="h-12 w-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${roleColor}20` }}
              >
                <RoleIcon className="h-6 w-6" style={{ color: roleColor }} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5">
                <StatusIndicator status={agent.status} size="md" pulse={agent.status === 'online'} />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white">{agent.name}</h3>
              <p className="text-sm text-slate-400">{agent.role}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
              <DropdownMenuItem 
                onClick={() => onMessage?.(agent)}
                className="text-slate-300 focus:text-white focus:bg-slate-800"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Message
              </DropdownMenuItem>
              <Link href={`/files?role=${agent.role}`}>
                <DropdownMenuItem 
                  className="text-slate-300 focus:text-white focus:bg-slate-800"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Memory
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <AgentStatusBadge status={agent.status} />
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(agent.lastActive)}
            </div>
          </div>
          
          {agent.currentTask && (
            <div className="bg-slate-800/50 rounded-md p-2">
              <p className="text-xs text-slate-500 mb-1">Current Task</p>
              <p className="text-sm text-slate-300 truncate">{agent.currentTask}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
