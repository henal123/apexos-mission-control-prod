/**
 * Client-Side OpenClaw Library
 * Uses WebSocket JSON-RPC protocol (NOT HTTP REST)
 * Works with static export
 */
import { Agent, GatewayStatus, SubagentInfo, isMixedContentIssue, getConnectionError } from './real-openclaw';
export type { Agent, GatewayStatus, SubagentInfo };
export { isMixedContentIssue, getConnectionError };

const DEFAULT_GATEWAY_URL = 'wss://henal-open-claw.duckdns.org';
const DEFAULT_GATEWAY_TOKEN = '37b8280cb7ebb287dc44db0d76befef976be004b5f25d1b3';

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

// ============================================
// BUG FIX 3: Better role parsing with label support
// ============================================
function parseRoleFromKey(key: string, label?: string, task?: string): string {
  // First check the label/task for explicit role mentions
  const textToCheck = `${label || ''} ${task || ''}`.toLowerCase();
  
  if (textToCheck.includes('ceo') || key.toLowerCase().includes('ceo')) return 'CEO';
  if (textToCheck.includes('coo') || key.toLowerCase().includes('coo')) return 'COO';
  if (textToCheck.includes('cmo') || key.toLowerCase().includes('cmo')) return 'CMO';
  if (textToCheck.includes('cro') || key.toLowerCase().includes('cro')) return 'CRO';
  if (textToCheck.includes('cto') || key.toLowerCase().includes('cto')) return 'CTO';
  if (textToCheck.includes('cgo') || key.toLowerCase().includes('cgo')) return 'CGO';
  if (textToCheck.includes('cfo') || key.toLowerCase().includes('cfo')) return 'CFO';
  if (textToCheck.includes('chro') || key.toLowerCase().includes('chro')) return 'CHRO';
  
  // Check for agent names
  if (textToCheck.includes('velocity')) return 'CTO';
  if (textToCheck.includes('atlas')) return 'COO';
  if (textToCheck.includes('monarch')) return 'CFO';
  if (textToCheck.includes('growth')) return 'CMO';
  if (textToCheck.includes('nova')) return 'CHRO';
  
  // Return label as name if available, else derive from key type
  if (label) {
    if (label.toLowerCase().includes('cron:')) return 'Cron Job';
    if (label.toLowerCase().includes('subagent:')) return 'Subagent';
    // Truncate long labels for display
    if (label.length > 30) return label.slice(0, 27) + '...';
    return label;
  }
  
  // Check key patterns
  const keyLower = key.toLowerCase();
  if (keyLower.includes('cron:')) return 'Cron Job';
  if (keyLower.includes('subagent:')) return 'Subagent';
  if (keyLower.includes('main')) return 'Main Agent';
  
  return 'Agent';
}

function determineStatus(session: SubagentInfo): Agent['status'] {
  if (session.status === 'running') return 'busy';
  const lastActivity = new Date(session.startedAt);
  const now = new Date();
  const diffMins = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
  return diffMins < 30 ? 'online' : 'offline';
}

// ============================================
// WebSocket JSON-RPC Helper
// ============================================
let rpcIdCounter = 0;
function nextRpcId(): string {
  return `rpc-${++rpcIdCounter}-${Date.now()}`;
}

/**
 * Opens a one-shot WebSocket, performs JSON-RPC handshake,
 * sends a method, gets response, and closes.
 * FALLBACK ONLY - use openClawWS.sendRpc() for normal operations
 */
function rpcCall(
  url: string,
  token: string,
  method: string,
  params: Record<string, unknown> = {},
  timeoutMs: number = 10000
): Promise<{ ok: boolean; payload?: any; error?: any }> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      ws.close();
      resolve({ ok: false, error: { message: 'Timeout' } });
    }, timeoutMs);

    let authenticated = false;
    const reqId = nextRpcId();
    const ws = new WebSocket(url);

    ws.onopen = () => {
      // Wait for connect.challenge from server
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        // Step 1: Server sends connect.challenge → we reply with connect
        if (msg.type === 'event' && msg.event === 'connect.challenge') {
          const connectMsg = {
            type: 'req',
            id: 'auth-' + Date.now(),
            method: 'connect',
            params: {
              minProtocol: 3,
              maxProtocol: 3,
              client: {
                id: 'openclaw-control-ui',
                version: '2026.2.21',
                platform: 'browser',
                mode: 'ui',
              },
              role: 'operator',
              scopes: ['operator.read', 'operator.write', 'operator.admin'],
              caps: [],
              auth: { token },
            },
          };
          ws.send(JSON.stringify(connectMsg));
          return;
        }

        // Step 2: Server responds to connect → check if authenticated
        if (msg.type === 'res' && msg.id && msg.id.startsWith('auth-')) {
          if (msg.ok) {
            authenticated = true;
            // If caller just wanted to check status (method === 'connect'), resolve now
            if (method === 'connect') {
              clearTimeout(timer);
              ws.close();
              resolve({ ok: true, payload: msg.payload });
              return;
            }
            // Otherwise send the actual RPC method
            ws.send(JSON.stringify({
              type: 'req',
              id: reqId,
              method,
              params,
            }));
          } else {
            console.error('[RPC] Auth failed:', JSON.stringify(msg));
            clearTimeout(timer);
            ws.close();
            resolve({ ok: false, error: msg.error });
          }
          return;
        }

        // Step 3: Response to our actual RPC call
        if (msg.type === 'res' && msg.id === reqId) {
          clearTimeout(timer);
          ws.close();
          resolve({ ok: msg.ok, payload: msg.payload, error: msg.error });
          return;
        }
      } catch (e) {
        // ignore parse errors
      }
    };

    ws.onerror = () => {
      clearTimeout(timer);
      resolve({ ok: false, error: { message: 'WebSocket connection error' } });
    };

    ws.onclose = () => {
      clearTimeout(timer);
      if (!authenticated && method !== 'connect') {
        resolve({ ok: false, error: { message: 'Connection closed before auth' } });
      }
    };
  });
}

// ============================================
// Public API
// ============================================

/**
 * BUG FIX 1: Check gateway status via persistent WebSocket
 * Only opens a test WebSocket if persistent connection isn't active
 */
export async function checkGatewayStatus(): Promise<GatewayStatus> {
  const config = getConfig();
  const startTime = Date.now();
  
  // If persistent WebSocket is authenticated, use that
  if (openClawWS && openClawWS.isAuthenticated()) {
    const status: GatewayStatus = {
      connected: true,
      url: config.gatewayUrl,
      tokenConfigured: !!config.gatewayToken,
      lastFetch: new Date().toISOString(),
      error: null,
      responseTime: Date.now() - startTime,
    };
    updateConnectionState(status);
    return status;
  }
  
  // Otherwise do a quick test connection
  try {
    const result = await rpcCall(config.gatewayUrl, config.gatewayToken, 'connect', {}, 8000);
    const status: GatewayStatus = {
      connected: result.ok,
      url: config.gatewayUrl,
      tokenConfigured: !!config.gatewayToken,
      lastFetch: new Date().toISOString(),
      error: result.ok ? null : (result.error?.message || 'Gateway unreachable'),
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

/**
 * BUG FIX 2: Fetch subagents using persistent WebSocket
 */
export async function fetchSubagents(): Promise<{ agents: Agent[]; error?: string }> {
  // Try using persistent WebSocket first
  if (openClawWS && openClawWS.isAuthenticated()) {
    try {
      const result = await openClawWS.sendRpc('sessions.list', {});
      
      if (!result.ok) {
        // Try alternate method names
        if (!result.ok) {
          const result2 = await openClawWS.sendRpc('session.list', {});
          if (result2.ok) return processSessions(result2.payload);
        }
        
        updateConnectionState({ connected: true, error: null });
        return { agents: [], error: undefined };
      }
      
      return processSessions(result.payload);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch subagents';
      updateConnectionState({ connected: false, error: errorMsg });
      return { agents: [], error: errorMsg };
    }
  }
  
  // Fallback to one-shot RPC if persistent connection not available
  const config = getConfig();
  try {
    let result = await rpcCall(config.gatewayUrl, config.gatewayToken, 'sessions.list', {});
    if (!result.ok) {
      result = await rpcCall(config.gatewayUrl, config.gatewayToken, 'session.list', {});
    }
    if (!result.ok) {
      result = await rpcCall(config.gatewayUrl, config.gatewayToken, 'agents.list', {});
    }
    if (!result.ok) {
      updateConnectionState({ connected: true, error: null });
      return { agents: [], error: undefined };
    }
    
    return processSessions(result.payload);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to fetch subagents';
    updateConnectionState({ connected: false, error: errorMsg });
    return { agents: [], error: errorMsg };
  }
}

// Helper to process sessions into Agent array
function processSessions(payload: any): { agents: Agent[]; error?: string } {
  const sessions = payload?.sessions || payload || [];
  if (!Array.isArray(sessions)) {
    return { agents: [], error: undefined };
  }

  const agents: Agent[] = sessions.map((session: any) => ({
    id: session.key?.split(':').pop() || session.id || 'unknown',
    name: parseRoleFromKey(session.key || '', session.label, session.task),
    role: parseRoleFromKey(session.key || '', session.label, session.task) as Agent['role'],
    status: determineStatus({
      ...session,
      startedAt: new Date(session.created_at || session.startedAt || Date.now()).getTime(),
    } as SubagentInfo),
    currentTask: session.metadata?.current_task || session.label || session.task || 'No task',
    lastActive: session.last_activity || session.created_at || new Date().toISOString(),
    sessionKey: session.key || session.sessionKey,
  }));

  updateConnectionState({ connected: true, lastFetch: new Date().toISOString(), error: null });
  return { agents };
}

export async function executeCommand(command: string): Promise<{
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
}> {
  return {
    success: false,
    error: 'Command execution requires a backend service. Use OpenClaw CLI directly.',
  };
}

export async function readFile(filePath: string): Promise<{ content: string | null; error?: string; }> {
  // Use persistent WebSocket if available
  if (openClawWS && openClawWS.isAuthenticated()) {
    try {
      const result = await openClawWS.sendRpc('files.read', { path: filePath });
      if (result.ok) {
        return { content: result.payload?.content || null };
      }
      return { content: null, error: result.error?.message || 'Failed to read file' };
    } catch (error) {
      return { content: null, error: error instanceof Error ? error.message : 'Failed to read file' };
    }
  }
  
  // Fallback
  const config = getConfig();
  try {
    const result = await rpcCall(config.gatewayUrl, config.gatewayToken, 'files.read', { path: filePath });
    if (result.ok) {
      return { content: result.payload?.content || null };
    }
    return { content: null, error: result.error?.message || 'Failed to read file' };
  } catch (error) {
    return { content: null, error: error instanceof Error ? error.message : 'Failed to read file' };
  }
}

export async function writeFile(filePath: string, content: string): Promise<{ success: boolean; error?: string; }> {
  // Use persistent WebSocket if available
  if (openClawWS && openClawWS.isAuthenticated()) {
    try {
      const result = await openClawWS.sendRpc('files.write', { path: filePath, content });
      if (result.ok) return { success: true };
      return { success: false, error: result.error?.message || 'Failed to write file' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to write file' };
    }
  }
  
  // Fallback
  const config = getConfig();
  try {
    const result = await rpcCall(config.gatewayUrl, config.gatewayToken, 'files.write', { path: filePath, content });
    if (result.ok) return { success: true };
    return { success: false, error: result.error?.message || 'Failed to write file' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to write file' };
  }
}

// ============================================
// Persistent WebSocket for real-time events
// BUG FIX 2: Added sendRpc method
// ============================================
export class OpenClawWebSocket {
  private ws: WebSocket | null = null;
  private reconnectInterval: number = 5000;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private authenticated: boolean = false;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private pendingRequests: Map<string, { resolve: (value: any) => void; reject: (reason: any) => void; timer: NodeJS.Timeout }> = new Map();

  connect(): Promise<boolean> {
    return new Promise((resolve) => {
      const config = getConfig();
      try {
        this.ws = new WebSocket(config.gatewayUrl);
        this.ws.onopen = () => {
          console.log('[OpenClaw WS] Connected, waiting for challenge...');
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);

            // Handle connect.challenge
            if (msg.type === 'event' && msg.event === 'connect.challenge') {
              const connectMsg = {
                type: 'req',
                id: 'auth-' + Date.now(),
                method: 'connect',
                params: {
                  minProtocol: 3,
                  maxProtocol: 3,
                  client: {
                    id: 'openclaw-control-ui',
                    version: '2026.2.21',
                    platform: 'browser',
                    mode: 'ui',
                  },
                  role: 'operator',
                  scopes: ['operator.read', 'operator.write', 'operator.admin'],
                  caps: [],
                  auth: { token: config.gatewayToken },
                },
              };
              this.ws?.send(JSON.stringify(connectMsg));
              return;
            }

            // Handle auth response
            if (msg.type === 'res' && msg.id && String(msg.id).startsWith('auth-')) {
              if (msg.ok) {
                this.authenticated = true;
                this.reconnectAttempts = 0;
                console.log('[OpenClaw WS] Authenticated successfully');
                updateConnectionState({ connected: true, error: null });
                resolve(true);
              } else {
                console.error('[OpenClaw WS] Auth failed:', msg.error);
                updateConnectionState({ connected: false, error: msg.error?.message || 'Auth failed' });
                resolve(false);
              }
              return;
            }

            // Handle RPC responses
            if (msg.type === 'res' && msg.id && this.pendingRequests.has(msg.id)) {
              const pending = this.pendingRequests.get(msg.id)!;
              clearTimeout(pending.timer);
              this.pendingRequests.delete(msg.id);
              pending.resolve({ ok: msg.ok, payload: msg.payload, error: msg.error });
              return;
            }

            // Handle all other messages/events
            this.emit('message', msg);
            if (msg.type === 'event') {
              this.emit(msg.event, msg.payload);
              // Map session-related events to session_update
              if (msg.event?.includes('session') || msg.event?.includes('agent')) {
                this.emit('session_update', msg);
              }
              if (msg.event === 'sessions.changed' || msg.event === 'session.update') {
                this.emit('session_update', msg);
              }
            }
          } catch (error) {
            console.error('[OpenClaw WS] Parse error:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[OpenClaw WS] Error:', error);
          updateConnectionState({ connected: false, error: 'WebSocket error' });
          // Reject any pending requests
          this.pendingRequests.forEach((pending) => {
            clearTimeout(pending.timer);
            pending.reject({ message: 'WebSocket error' });
          });
          this.pendingRequests.clear();
          resolve(false);
        };

        this.ws.onclose = () => {
          console.log('[OpenClaw WS] Disconnected');
          this.authenticated = false;
          updateConnectionState({ connected: false });
          // Reject any pending requests
          this.pendingRequests.forEach((pending) => {
            clearTimeout(pending.timer);
            pending.reject({ message: 'Connection closed' });
          });
          this.pendingRequests.clear();
          this.attemptReconnect();
        };
      } catch (error) {
        console.error('[OpenClaw WS] Connection failed:', error);
        updateConnectionState({ connected: false, error: String(error) });
        resolve(false);
      }
    });
  }

  /**
   * BUG FIX 2: Send RPC request over persistent WebSocket
   */
  sendRpc(method: string, params: Record<string, unknown> = {}, timeoutMs: number = 10000): Promise<{ ok: boolean; payload?: any; error?: any }> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.authenticated) {
        reject({ message: 'WebSocket not connected or authenticated' });
        return;
      }
      
      const reqId = nextRpcId();
      
      // Set timeout
      const timer = setTimeout(() => {
        this.pendingRequests.delete(reqId);
        reject({ message: 'RPC timeout' });
      }, timeoutMs);
      
      // Store pending request
      this.pendingRequests.set(reqId, { resolve, reject, timer });
      
      // Send request
      this.ws.send(JSON.stringify({
        type: 'req',
        id: reqId,
        method,
        params,
      }));
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
    // Clear pending requests
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timer);
    });
    this.pendingRequests.clear();
  }

  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN && this.authenticated) {
      this.ws.send(JSON.stringify(data));
    }
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }
}

export const openClawWS = typeof window !== 'undefined' ? new OpenClawWebSocket() : null;

// BUG FIX 5: Helper to get gateway URL for display
export function getGatewayUrl(): string {
  return getConfig().gatewayUrl;
}

// BUG FIX 6 & 7: Listen for live events and update state
export function subscribeToEvents(callback: (event: string, data: any) => void): () => void {
  if (!openClawWS) return () => {};
  
  const handler = (data: any) => callback('session_update', data);
  openClawWS.on('session_update', handler);
  
  return () => {
    // Note: OpenClawWebSocket doesn't support unsubscribe yet
  };
}
