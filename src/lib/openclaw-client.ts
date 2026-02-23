/**
 * Client-Side OpenClaw Library
 * Direct execution via exec tool - NO API ROUTES NEEDED
 * Works with static export
 */

import { Agent, GatewayStatus, SubagentInfo, isMixedContentIssue, getConnectionError } from './real-openclaw';
export type { Agent, GatewayStatus, SubagentInfo };
export { isMixedContentIssue, getConnectionError };

// Default configuration
const DEFAULT_GATEWAY_URL = 'wss://henal-open-claw.duckdns.org';
const DEFAULT_GATEWAY_TOKEN = '37b8280cb7ebb287dc44db0d76befef976be004b5f25d1b3';

// Configuration storage
export interface OpenClawConfig {
  gatewayUrl: string;
  gatewayToken: string;
  autoRefresh: boolean;
  refreshInterval: number;
}

export function getConfig(): OpenClawConfig {
  if (typeof window === 'undefined') {
    return {
      gatewayUrl: DEFAULT_GATEWAY_URL,
      gatewayToken: DEFAULT_GATEWAY_TOKEN,
      autoRefresh: true,
      refreshInterval: 60,
    };
  }
  
  const stored = localStorage.getItem('openclaw-config');
  if (stored) {
    return { ...JSON.parse(stored), gatewayToken: DEFAULT_GATEWAY_TOKEN };
  }
  
  return {
    gatewayUrl: DEFAULT_GATEWAY_URL,
    gatewayToken: DEFAULT_GATEWAY_TOKEN,
    autoRefresh: true,
    refreshInterval: 60,
  };
}

export function saveConfig(config: Partial<OpenClawConfig>): void {
  if (typeof window === 'undefined') return;
  const current = getConfig();
  const updated = { ...current, ...config };
  localStorage.setItem('openclaw-config', JSON.stringify(updated));
}

// Connection state
let connectionState: GatewayStatus = {
  connected: false,
  url: DEFAULT_GATEWAY_URL,
  tokenConfigured: true,
  lastFetch: null,
  error: null,
};

export function getConnectionState(): GatewayStatus {
  return { ...connectionState };
}

export function updateConnectionState(update: Partial<GatewayStatus>): void {
  connectionState = { ...connectionState, ...update };
}

// Parse role from session key
function parseRoleFromKey(key: string): string {
  const keyLower = key.toLowerCase();
  if (keyLower.includes('ceo')) return 'CEO';
  if (keyLower.includes('coo')) return 'COO';
  if (keyLower.includes('cmo')) return 'CMO';
  if (keyLower.includes('cro')) return 'CRO';
  if (keyLower.includes('cto')) return 'CTO';
  if (keyLower.includes('cgo')) return 'CGO';
  if (keyLower.includes('velocity')) return 'CTO';
  if (keyLower.includes('atlas')) return 'COO';
  if (keyLower.includes('monarch')) return 'CEO';
  if (keyLower.includes('growth')) return 'CGO';
  if (keyLower.includes('nova')) return 'CTO';
  return 'Agent';
}

function determineStatus(session: SubagentInfo): Agent['status'] {
  if (session.status === 'running') return 'busy';
  const lastActivity = new Date(session.startedAt);
  const now = new Date();
  const diffMins = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
  return diffMins < 30 ? 'online' : 'offline';
}

// Check gateway status - CLIENT SIDE
export async function checkGatewayStatus(): Promise<GatewayStatus> {
  const config = getConfig();
  const startTime = Date.now();
  
  try {
    // Try to connect to the actual OpenClaw WebSocket
    const wsUrl = config.gatewayUrl.replace('ws://', 'http://').replace('wss://', 'https://');
    
    const response = await fetch(`${wsUrl}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.gatewayToken}`,
      },
    }).catch(() => null);
    
    const connected = response?.ok || false;
    
    const status: GatewayStatus = {
      connected,
      url: config.gatewayUrl,
      tokenConfigured: !!config.gatewayToken,
      lastFetch: new Date().toISOString(),
      error: connected ? null : 'Gateway unreachable',
      responseTime: Date.now() - startTime,
    };
    
    updateConnectionState(status);
    return status;
  } catch (error) {
    const status: GatewayStatus = {
      connected: false,
      url: config.gatewayUrl,
      tokenConfigured: !!config.gatewayToken,
      lastFetch: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Connection failed',
    };
    updateConnectionState(status);
    return status;
  }
}

// Fetch subagents via WebSocket or HTTP API
export async function fetchSubagents(): Promise<{ agents: Agent[]; error?: string }> {
  const config = getConfig();
  
  try {
    // Try HTTP API first
    const apiUrl = config.gatewayUrl.replace('ws://', 'http://').replace('wss://', 'https://');
    
    const response = await fetch(`${apiUrl}/api/sessions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.gatewayToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.sessions || !Array.isArray(data.sessions)) {
      return { agents: [], error: 'Invalid response format' };
    }
    
    // Map sessions to agents
    const agents: Agent[] = data.sessions.map((session: any) => ({
      id: session.key?.split(':').pop() || 'unknown',
      name: parseRoleFromKey(session.key || ''),
      role: parseRoleFromKey(session.key || ''),
      status: determineStatus({
        ...session,
        startedAt: new Date(session.created_at || Date.now()).getTime(),
      } as SubagentInfo),
      currentTask: session.metadata?.current_task || session.label || 'No task',
      lastActive: session.last_activity || session.created_at || new Date().toISOString(),
      sessionKey: session.key,
    }));
    
    updateConnectionState({
      connected: true,
      lastFetch: new Date().toISOString(),
      error: null,
    });
    
    return { agents };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to fetch subagents';
    updateConnectionState({
      connected: false,
      error: errorMsg,
    });
    return { agents: [], error: errorMsg };
  }
}

// Execute a command (simulated - would need a bridge service for real exec)
export async function executeCommand(command: string): Promise<{
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
}> {
  // For static export, we'd need a bridge service
  // Return a message indicating this needs backend support
  return {
    success: false,
    error: 'Command execution requires a backend service. Please use the OpenClaw CLI directly.',
  };
}

// Read file via API
export async function readFile(filePath: string): Promise<{
  content: string | null;
  error?: string;
}> {
  const config = getConfig();
  
  try {
    const apiUrl = config.gatewayUrl.replace('ws://', 'http://').replace('wss://', 'https://');
    
    const response = await fetch(`${apiUrl}/api/files/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.gatewayToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: filePath }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return { content: data.content };
  } catch (error) {
    return {
      content: null,
      error: error instanceof Error ? error.message : 'Failed to read file',
    };
  }
}

// Write file via API
export async function writeFile(filePath: string, content: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const config = getConfig();
  
  try {
    const apiUrl = config.gatewayUrl.replace('ws://', 'http://').replace('wss://', 'https://');
    
    const response = await fetch(`${apiUrl}/api/files/write`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.gatewayToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: filePath, content }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to write file',
    };
  }
}

// WebSocket connection for real-time updates
export class OpenClawWebSocket {
  private ws: WebSocket | null = null;
  private reconnectInterval: number = 5000;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  
  connect(): Promise<boolean> {
    return new Promise((resolve) => {
      const config = getConfig();
      
      try {
        this.ws = new WebSocket(`${config.gatewayUrl}?token=${config.gatewayToken}`);
        
        this.ws.onopen = () => {
          console.log('[OpenClaw WS] Connected');
          this.reconnectAttempts = 0;
          updateConnectionState({ connected: true, error: null });
          resolve(true);
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.emit('message', data);
            
            if (data.type === 'session_update') {
              this.emit('session_update', data);
            }
          } catch (error) {
            console.error('[OpenClaw WS] Parse error:', error);
          }
        };
        
        this.ws.onerror = (error) => {
          console.error('[OpenClaw WS] Error:', error);
          updateConnectionState({ connected: false, error: 'WebSocket error' });
          resolve(false);
        };
        
        this.ws.onclose = () => {
          console.log('[OpenClaw WS] Disconnected');
          updateConnectionState({ connected: false });
          this.attemptReconnect();
        };
      } catch (error) {
        console.error('[OpenClaw WS] Connection failed:', error);
        updateConnectionState({ connected: false, error: String(error) });
        resolve(false);
      }
    });
  }
  
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[OpenClaw WS] Max reconnect attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`[OpenClaw WS] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }
  
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }
  
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }
  
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

// Singleton instance
export const openClawWS = typeof window !== 'undefined' ? new OpenClawWebSocket() : null;
