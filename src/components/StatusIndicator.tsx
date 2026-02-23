import { cn } from '@/lib/utils';
import { getStatusColor } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy';
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  pulse?: boolean;
}

const sizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
};

const statusLabels = {
  online: 'Online',
  offline: 'Offline',
  busy: 'Busy',
};

export function StatusIndicator({
  status,
  size = 'md',
  showTooltip = true,
  pulse = false,
}: StatusIndicatorProps) {
  const colorClass = getStatusColor(status);
  
  const indicator = (
    <span
      className={cn(
        'inline-block rounded-full',
        sizeClasses[size],
        colorClass,
        pulse && status === 'online' && 'animate-pulse'
      )}
    />
  );

  if (!showTooltip) return indicator;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{indicator}</TooltipTrigger>
        <TooltipContent>
          <p>{statusLabels[status]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function AgentStatusBadge({ status, className }: { status: string; className?: string }) {
  const config = {
    online: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', label: 'Online' },
    offline: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'Offline' },
    busy: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', label: 'Busy' },
  };

  const style = config[status as keyof typeof config] || config.offline;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
        style.bg,
        style.text,
        style.border,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.text.replace('text-', 'bg-'))} />
      {style.label}
    </span>
  );
}
