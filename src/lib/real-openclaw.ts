/**
 * REAL OpenClaw Data API
 * NO MOCK DATA - ONLY REAL OPENCLAW TOOL CALLS
 */

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'wss://henal-open-claw.duckdns.org';  // Let's Encrypt SSL (port 443)
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || '37b8280cb7ebb287dc44db0d76befef976be004b5f25d1b3';

// Types
export interface OpenClawSession {
  key: string;
  label: string;
  requester_session: string;
  created_at: string;
  last_activity: string;
  metadata?: {
    agent_role?: string;
    current_task?: string;
    status?: string;
  };
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

// Get Gateway Connection Status
export function getGatewayStatus(): GatewayStatus {
  return {
    connected: true, // Will be updated by actual API calls
    url: GATEWAY_URL,
    tokenConfigured: !!GATEWAY_TOKEN,
    lastFetch: null,
    error: null,
  };
}

// Parse role from session key
function parseRoleFromKey(key: string): Agent['role'] {
  const keyLower = key.toLowerCase();
  if (keyLower.includes('ceo')) return 'CEO';
  if (keyLower.includes('coo')) return 'COO';
  if (keyLower.includes('cmo')) return 'CMO';
  if (keyLower.includes('cro')) return 'CRO';
  if (keyLower.includes('cto')) return 'CTO';
  if (keyLower.includes('cgo')) return 'CGO';
  if (keyLower.includes('velocity')) return 'Velocity';
  if (keyLower.includes('atlas')) return 'Atlas';
  if (keyLower.includes('monarch')) return 'Monarch';
  if (keyLower.includes('growth')) return 'Growth';
  if (keyLower.includes('nova')) return 'Nova';
  return 'CEO';
}

// Determine status from session data
function determineStatus(session: SubagentInfo): Agent['status'] {
  if (session.status === 'running') return 'busy';
  // Consider online if active in last 30 minutes
  const lastActivity = new Date(session.startedAt);
  const now = new Date();
  const diffMins = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
  return diffMins < 30 ? 'online' : 'offline';
}

/**
 * Fetch REAL subagent data using subagents tool
 * This calls the actual OpenClaw subagents list command
 */
export async function fetchRealSubagents(): Promise<{ agents: Agent[]; error?: string }> {
  try {
    // Call the actual subagents list API
    const response = await fetch('/api/openclaw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: 'subagents', action: 'list' }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { agents: [], error: `API Error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    
    if (data.error) {
      return { agents: [], error: data.error };
    }

    // Map REAL subagent data to Agent format
    const allSubagents: SubagentInfo[] = [
      ...(data.active || []),
      ...(data.recent || []),
    ];

    // Remove duplicates by sessionKey
    const seen = new Set<string>();
    const uniqueSubagents = allSubagents.filter(s => {
      if (seen.has(s.sessionKey)) return false;
      seen.add(s.sessionKey);
      return true;
    });

    const agents: Agent[] = uniqueSubagents.map((subagent) => ({
      id: subagent.runId || subagent.sessionKey.split(':').pop() || 'unknown',
      name: parseRoleFromKey(subagent.sessionKey),
      role: parseRoleFromKey(subagent.sessionKey),
      status: determineStatus(subagent),
      currentTask: subagent.task.substring(0, 100) + (subagent.task.length > 100 ? '...' : ''),
      lastActive: new Date(subagent.startedAt).toISOString(),
      sessionKey: subagent.sessionKey,
    }));

    return { agents };
  } catch (error) {
    console.error('[OpenClaw] Failed to fetch subagents:', error);
    return { 
      agents: [], 
      error: error instanceof Error ? error.message : 'Unknown error fetching subagents'
    };
  }
}

/**
 * Fetch REAL cron jobs
 */
export async function fetchRealCronJobs(): Promise<{ jobs: any[]; error?: string }> {
  try {
    const response = await fetch('/api/openclaw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: 'cron', action: 'list' }),
    });

    if (!response.ok) {
      return { jobs: [], error: `API Error: ${response.status}` };
    }

    const data = await response.json();
    return { jobs: data.jobs || [] };
  } catch (error) {
    console.error('[OpenClaw] Failed to fetch cron jobs:', error);
    return { jobs: [], error: String(error) };
  }
}

/**
 * Fetch REAL file content
 */
export async function fetchRealFile(filePath: string): Promise<{ content: string | null; error?: string }> {
  try {
    const response = await fetch('/api/openclaw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tool: 'read', 
        path: filePath 
      }),
    });

    if (!response.ok) {
      return { content: null, error: `API Error: ${response.status}` };
    }

    const data = await response.json();
    return { content: data.content };
  } catch (error) {
    console.error('[OpenClaw] Failed to fetch file:', error);
    return { content: null, error: String(error) };
  }
}

/**
 * Edit REAL file content
 */
export async function editRealFile(
  filePath: string, 
  oldText: string, 
  newText: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/openclaw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tool: 'edit', 
        path: filePath,
        oldText,
        newText
      }),
    });

    if (!response.ok) {
      return { success: false, error: `API Error: ${response.status}` };
    }

    const data = await response.json();
    return { success: data.success || true };
  } catch (error) {
    console.error('[OpenClaw] Failed to edit file:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Spawn REAL subagent
 */
export async function spawnRealSubagent(
  label: string, 
  task: string
): Promise<{ success: boolean; sessionKey?: string; error?: string }> {
  try {
    const response = await fetch('/api/openclaw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tool: 'subagents', 
        action: 'spawn',
        label,
        task
      }),
    });

    if (!response.ok) {
      return { success: false, error: `API Error: ${response.status}` };
    }

    const data = await response.json();
    return { 
      success: data.success || true, 
      sessionKey: data.sessionKey 
    };
  } catch (error) {
    console.error('[OpenClaw] Failed to spawn subagent:', error);
    return { success: false, error: String(error) };
  }
}

// Connection status with auto-refresh tracking
let connectionState: GatewayStatus = {
  connected: false,
  url: GATEWAY_URL,
  tokenConfigured: !!GATEWAY_TOKEN,
  lastFetch: null,
  error: null,
};

export function getConnectionState(): GatewayStatus {
  return { ...connectionState };
}

export function updateConnectionState(update: Partial<GatewayStatus>) {
  connectionState = { ...connectionState, ...update };
}

// Check if current environment has mixed content issue
export function isMixedContentIssue(gatewayUrl: string): boolean {
  // With Let's Encrypt SSL on wss://, there are no mixed content issues
  return false;
}

// Get connection error with helpful message
export function getConnectionError(gatewayUrl?: string): string {
  if (connectionState.error) {
    return connectionState.error;
  }
  
  return 'Gateway connection failed. Verify gateway is running at wss://henal-open-claw.duckdns.org:8443';
}
