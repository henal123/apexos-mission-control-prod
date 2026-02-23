import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'P0':
    case 'urgent':
      return 'bg-red-500 text-white';
    case 'P1':
    case 'high':
      return 'bg-orange-500 text-white';
    case 'P2':
    case 'medium':
      return 'bg-yellow-500 text-black';
    case 'P3':
    case 'low':
      return 'bg-blue-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'online':
      return 'bg-green-500';
    case 'busy':
      return 'bg-yellow-500';
    case 'offline':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Mock readFile function for client-side use
export async function readFile(filePath: string): Promise<{ content: string | null; error?: string }> {
  // This is a mock implementation for client-side use
  // In production, this would call an API endpoint
  return {
    content: null,
    error: 'File reading requires server-side implementation'
  };
}
