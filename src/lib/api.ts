import { Agent, Task, Conversation, Message, MemoryFile } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Agents API
export const agentsApi = {
  getAll: () => fetcher<Agent[]>('/agents'),
  getById: (id: string) => fetcher<Agent>(`/agents/${id}`),
  getMemory: (id: string) => fetcher<MemoryFile[]>(`/agents/${id}/memory`),
};

// Tasks API
export const tasksApi = {
  getAll: () => fetcher<Task[]>('/tasks'),
  create: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => 
    fetcher<Task>('/tasks', { method: 'POST', body: JSON.stringify(task) }),
  update: (id: string, updates: Partial<Task>) => 
    fetcher<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  delete: (id: string) => 
    fetcher<void>(`/tasks/${id}`, { method: 'DELETE' }),
};

// Conversations API
export const conversationsApi = {
  getAll: () => fetcher<Conversation[]>('/conversations'),
  getById: (id: string) => fetcher<Conversation>(`/conversations/${id}`),
  getMessages: (id: string) => fetcher<Message[]>(`/conversations/${id}/messages`),
};

// Memory API
export const memoryApi = {
  getTree: (path?: string) => fetcher<MemoryFile[]>(`/memory?path=${path || ''}`),
  getFile: (path: string) => fetcher<MemoryFile>(`/memory/file?path=${path}`),
  updateFile: (path: string, content: string) => 
    fetcher<MemoryFile>(`/memory/file?path=${path}`, { 
      method: 'PUT', 
      body: JSON.stringify({ content }) 
    }),
};
