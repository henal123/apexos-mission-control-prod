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
                id: 'web',
                version: '2026.2.21',
                platform: 'browser',
                mode: 'control-ui',
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
 * Check gateway status via WebSocket JSON-RPC handshake
 */
export async function checkGatewayStatus(): Promise<GatewayStatus> {
  const config = getConfig();
  const startTime = Date.now();
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
 * Fetch subagents via WebSocket JSON-RPC
 */
export async function fetchSubagents(): Promise<{ agents: Agent[]; error?: string }> {
  const config = getConfig();
  try {
    // Try sessions.list first
    let result = await rpcCall(config.gatewayUrl, config.gatewayToken, 'sessions.list', {});
    // If sessions.list doesn't work, try other method names
    if (!result.ok) {
      result = await rpcCall(config.gatewayUrl, config.gatewayToken, 'session.list', {});
    }
    if (!result.ok) {
      result = await rpcCall(config.gatewayUrl, config.gatewayToken, 'agents.list', {});
    }
    if (!result.ok) {
      updateConnectionState({ connected: true, error: null }); // Connected but no sessions method found — return empty
      return { agents: [], error: undefined };
    }

    const sessions = result.payload?.sessions || result.payload || [];
    if (!Array.isArray(sessions)) {
      return { agents: [], error: undefined };
    }

    const agents: Agent[] = sessions.map((session: any) => ({
      id: session.key?.split(':').pop() || session.id || 'unknown',
      name: parseRoleFromKey(session.key || session.label || ''),
      role: parseRoleFromKey(session.key || session.label || ''),
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
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to fetch subagents';
    updateConnectionState({ connected: false, error: errorMsg });
    return { agents: [], error: errorMsg };
  }
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
// ============================================
export class OpenClawWebSocket {
  private ws: WebSocket | null = null;
  private reconnectInterval: number = 5000;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private authenticated: boolean = false;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();

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
                    id: 'web',
                    version: '2026.2.21',
                    platform: 'browser',
                    mode: 'control-ui',
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

            // Handle all other messages
            this.emit('message', msg);
            if (msg.type === 'event') {
              this.emit(msg.event, msg.payload);
              // Map session-related events to session_update
              if (msg.event?.includes('session') || msg.event?.includes('agent')) {
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
          resolve(false);
        };

        this.ws.onclose = () => {
          console.log('[OpenClaw WS] Disconnected');
          this.authenticated = false;
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
    if (this.ws?.readyState === WebSocket.OPEN && this.authenticated) {
      this.ws.send(JSON.stringify(data));
    }
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }
}

export const openClawWS = typeof window !== 'undefined' ? new OpenClawWebSocket() : null;
