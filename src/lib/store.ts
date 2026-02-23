import { create } from 'zustand';
import { Agent, Task, Conversation, Message, MemoryFile, WebSocketMessage } from '@/types';

interface AppState {
  // Agents
  agents: Agent[];
  selectedAgent: Agent | null;
  setAgents: (agents: Agent[]) => void;
  updateAgent: (agent: Agent) => void;
  selectAgent: (agent: Agent | null) => void;
  
  // Tasks
  tasks: Task[];
  selectedTask: Task | null;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  selectTask: (task: Task | null) => void;
  moveTask: (taskId: string, newStatus: Task['status']) => void;
  
  // Conversations
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: Message[];
  setConversations: (conversations: Conversation[]) => void;
  selectConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  
  // Memory Files
  memoryTree: MemoryFile[];
  selectedFile: MemoryFile | null;
  setMemoryTree: (tree: MemoryFile[]) => void;
  selectFile: (file: MemoryFile | null) => void;
  updateFileContent: (path: string, content: string) => void;
  
  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  dismissNotification: (id: string) => void;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  timestamp: string;
}

export const useStore = create<AppState>((set, get) => ({
  // Agents
  agents: [],
  selectedAgent: null,
  setAgents: (agents) => set({ agents }),
  updateAgent: (agent) => set((state) => ({
    agents: state.agents.map((a) => (a.id === agent.id ? agent : a)),
  })),
  selectAgent: (agent) => set({ selectedAgent: agent }),
  
  // Tasks
  tasks: [],
  selectedTask: null,
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (task) => set((state) => ({
    tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
  })),
  deleteTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter((t) => t.id !== taskId),
  })),
  selectTask: (task) => set({ selectedTask: task }),
  moveTask: (taskId, newStatus) => set((state) => ({
    tasks: state.tasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
    ),
  })),
  
  // Conversations
  conversations: [],
  selectedConversation: null,
  messages: [],
  setConversations: (conversations) => set({ conversations }),
  selectConversation: (conversation) => set({ selectedConversation: conversation }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => {
    // Add to messages if conversation is selected
    const newMessages = state.selectedConversation?.id === message.conversationId
      ? [...state.messages, message]
      : state.messages;
    
    // Update conversation last message
    const newConversations = state.conversations.map((c) =>
      c.id === message.conversationId
        ? { ...c, lastMessage: message, updatedAt: message.timestamp }
        : c
    );
    
    return { messages: newMessages, conversations: newConversations };
  }),
  
  // Memory Files
  memoryTree: [],
  selectedFile: null,
  setMemoryTree: (tree) => set({ memoryTree: tree }),
  selectFile: (file) => set({ selectedFile: file }),
  updateFileContent: (path, content) => set((state) => ({
    memoryTree: updateTreeNode(state.memoryTree, path, { content }),
    selectedFile: state.selectedFile?.path === path
      ? { ...state.selectedFile, content }
      : state.selectedFile,
  })),
  
  // UI State
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),
  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications].slice(0, 10),
  })),
  dismissNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),
}));

// Helper function to update tree nodes recursively
function updateTreeNode(
  tree: MemoryFile[],
  path: string,
  updates: Partial<MemoryFile>
): MemoryFile[] {
  return tree.map((node) => {
    if (node.path === path) {
      return { ...node, ...updates };
    }
    if (node.children && path.startsWith(node.path + '/')) {
      return { ...node, children: updateTreeNode(node.children, path, updates) };
    }
    return node;
  });
}
