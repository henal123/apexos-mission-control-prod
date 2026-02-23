'use client';

import { Task } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatDate, getPriorityColor, truncateText } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { 
  Calendar, 
  Flag, 
  MoreHorizontal,
  User
} from 'lucide-react';

const priorityIcons = {
  urgent: Flag,
  high: Flag,
  medium: Flag,
  low: Flag,
};

interface TaskCardProps {
  task: Task;
  compact?: boolean;
  showActions?: boolean;
}

export function TaskCard({ task, compact = false, showActions = true }: TaskCardProps) {
  const { agents, selectTask } = useStore();
  const assignee = agents.find((a) => a.id === task.assignee) || 
    (task.assigneeName ? { name: task.assigneeName, color: task.assigneeColor } : null);
  const PriorityIcon = priorityIcons[task.priority as keyof typeof priorityIcons] || Flag;

  if (compact) {
    return (
      <Card 
        className="bg-slate-900 border-slate-800 hover:border-slate-600 cursor-pointer transition-colors group"
        onClick={() => selectTask(task)}
      >
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-slate-200 line-clamp-2 flex-1">
                {task.title}
              </p>
              <Badge 
                variant="secondary" 
                className={cn('text-[10px] px-1.5 py-0', getPriorityColor(task.priority))}
              >
                {task.priority}
              </Badge>
            </div>
            
            {assignee && (
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback 
                    className="text-[10px]" 
                    style={{ backgroundColor: task.assigneeColor || '#64748b' }}
                  >
                    {assignee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-slate-500">{assignee.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge 
                variant="secondary" 
                className={cn('text-xs', getPriorityColor(task.priority))}
              >
                <PriorityIcon className="h-3 w-3 mr-1" />
                {task.priority}
              </Badge>
              <span className="text-xs text-slate-500">#{task.id.slice(0, 8)}</span>
            </div>
            <h3 className="font-semibold text-white">{task.title}</h3>
          </div>
          
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-400">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-slate-800">
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-slate-800">
                  Assign Agent
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-400 focus:text-red-300 focus:bg-slate-800">
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {task.description && (
          <p className="text-sm text-slate-400">{truncateText(task.description, 150)}</p>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center gap-3">
            {assignee ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback 
                    className="text-xs"
                    style={{ backgroundColor: task.assigneeColor || '#64748b' }}
                  >
                    {assignee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-slate-400">{assignee.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <User className="h-3 w-3" />
                Unassigned
              </div>
            )}
          </div>
          
          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
