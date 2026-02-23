export interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'offline' | 'busy';
  currentTask?: string;
  lastActive: string;
  avatar?: string;
  sessionKey?: string;
}

export interface GatewayStatus {
  connected: boolean;
  url: string;
  tokenConfigured: boolean;
  lastFetch: string | null;
  error: string | null;
  responseTime?: number;
}

export interface SubagentInfo {
  index: number;
  runId: string;
  sessionKey: string;
  label: string;
  task: string;
  status: 'running' | 'done' | 'timeout' | 'error';
  runtime: string;
  runtimeMs: number;
  model: string;
  startedAt: number;
  endedAt?: number;
  totalTokens?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'backlog' | 'in-progress' | 'review' | 'done';
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  assigneeName?: string;
  assigneeColor?: string;
  assigneeId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type?: 'text' | 'system' | 'action';
}

export interface Conversation {
  id: string;
  participants: string[];
  participantIds: string[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
}

export interface MemoryFile {
  path: string;
  name: string;
  type: 'file' | 'directory';
  content?: string;
  children?: MemoryFile[];
  lastModified: string;
}

export interface WebSocketMessage {
  type: 'agent_status' | 'task_update' | 'new_message' | 'notification';
  payload: unknown;
  timestamp: string;
}

export type AgentRole = string;

export const AGENT_ROLES: Record<string, { label: string; color: string; icon: string }> = {
  CEO: { label: 'Chief Executive Officer', color: '#3b82f6', icon: 'Building2' },
  COO: { label: 'Chief Operating Officer', color: '#f59e0b', icon: 'Zap' },
  CMO: { label: 'Chief Marketing Officer', color: '#8b5cf6', icon: 'Crown' },
  CRO: { label: 'Chief Revenue Officer', color: '#10b981', icon: 'TrendingUp' },
  CTO: { label: 'Chief Technology Officer', color: '#ec4899', icon: 'Sparkles' },
  CGO: { label: 'Chief Growth Officer', color: '#06b6d4', icon: 'Target' },
  Atlas: { label: 'Systems Architect', color: '#3b82f6', icon: 'Server' },
  Velocity: { label: 'Performance Engineer', color: '#f59e0b', icon: 'Zap' },
  Monarch: { label: 'Project Manager', color: '#8b5cf6', icon: 'Crown' },
  Growth: { label: 'Business Development', color: '#10b981', icon: 'TrendingUp' },
  Nova: { label: 'CTO', color: '#ec4899', icon: 'Sparkles' },
};
