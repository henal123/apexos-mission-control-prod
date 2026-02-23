import { Agent } from '@/types';

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'ws://127.0.0.1:18789';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || '';

// Types for OpenClaw gateway responses
interface OpenClawSession {
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

interface SessionsListResponse {
  sessions: OpenClawSession[];
}

// Map OpenClaw session to Agent type
function mapSessionToAgent(session: OpenClawSession): Agent {
  const keyParts = session.key.split(':');
  const agentId = keyParts[keyParts.length - 1] || session.key;
  
  // Determine role from metadata or parse from session key
  const role = (session.metadata?.agent_role as Agent['role']) || 
    parseRoleFromKey(session.key) || 
    'Nova';
  
  // Determine status from metadata
  const status = (session.metadata?.status as Agent['status']) || 
    (session.last_activity && isRecent(session.last_activity) ? 'online' : 'offline');
  
  return {
    id: agentId,
    name: formatAgentName(role),
    role,
    status,
    currentTask: session.metadata?.current_task,
    lastActive: session.last_activity || session.created_at,
  };
}

function parseRoleFromKey(key: string): Agent['role'] | null {
  const keyLower = key.toLowerCase();
  if (keyLower.includes('atlas')) return 'Atlas';
  if (keyLower.includes('velocity')) return 'Velocity';
  if (keyLower.includes('monarch')) return 'Monarch';
  if (keyLower.includes('growth')) return 'Growth';
  if (keyLower.includes('nova')) return 'Nova';
  return null;
}

function formatAgentName(role: string): string {
  return role;
}

function isRecent(timestamp: string): boolean {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = diffMs / (1000 * 60);
  return diffMins < 5; // Consider online if active in last 5 minutes
}

// Fetch active sessions from OpenClaw gateway
export async function getActiveAgents(): Promise<Agent[]> {
  try {
    // Use the sessions_list tool via the gateway API
    const response = await fetch(`${GATEWAY_URL.replace('ws://', 'http://')}/api/sessions`, {
      headers: {
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sessions: ${response.statusText}`);
    }
    
    const data: SessionsListResponse = await response.json();
    return data.sessions.map(mapSessionToAgent);
  } catch (error) {
    console.error('[OpenClaw] Error fetching active agents:', error);
    return [];
  }
}

// WebSocket for real-time updates
export function connectWebSocket(onUpdate: (data: any) => void): WebSocket {
  const wsUrl = `${GATEWAY_URL}?token=${GATEWAY_TOKEN}`;
  const ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('[OpenClaw] WebSocket connected');
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onUpdate(data);
    } catch (error) {
      console.error('[OpenClaw] Failed to parse WebSocket message:', error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('[OpenClaw] WebSocket error:', error);
  };
  
  ws.onclose = () => {
    console.log('[OpenClaw] WebSocket disconnected');
  };
  
  return ws;
}

// Get session history for conversations
export async function getSessionHistory(sessionKey: string): Promise<any[]> {
  try {
    const response = await fetch(`${GATEWAY_URL.replace('ws://', 'http://')}/api/sessions/${sessionKey}/history`, {
      headers: {
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch session history: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[OpenClaw] Error fetching session history:', error);
    return [];
  }
}
