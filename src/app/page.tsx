'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Users, Zap, RefreshCw, Wifi, WifiOff, AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Agent, GatewayStatus } from '@/types';
import { 
  fetchSubagents, 
  checkGatewayStatus, 
  getConnectionState, 
  openClawWS,
  getConfig
} from '@/lib/openclaw-client';
import { ConnectionSettings } from '@/components/ConnectionSettings';

// REAL DATA ONLY - CLIENT SIDE
export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [connection, setConnection] = useState<GatewayStatus>(getConnectionState());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [mounted, setMounted] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check gateway status
      const status = await checkGatewayStatus();
      setConnection(status);

      if (status.connected) {
        // Fetch subagents
        const { agents: realAgents, error: subagentError } = await fetchSubagents();
        
        if (subagentError) {
          setError(subagentError);
        } else {
          setAgents(realAgents);
          setError(null);
        }
      } else {
        setError(status.error || 'Gateway disconnected');
        setAgents([]);
      }
      
      setLastFetch(new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }) + ' UTC');
      setCountdown(getConfig().refreshInterval);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setConnection(prev => ({ ...prev, connected: false, error: String(err) }));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and mount
  useEffect(() => {
    setMounted(true);
    fetchData();
    
    // Try WebSocket connection for real-time updates
    if (openClawWS) {
      openClawWS.connect();
      openClawWS.on('session_update', () => {
        fetchData();
      });
    }
    
    return () => {
      openClawWS?.disconnect();
    };
  }, [fetchData]);

  // Auto-refresh countdown
  useEffect(() => {
    if (!mounted || !getConfig().autoRefresh) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchData();
          return getConfig().refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [mounted, fetchData]);

  // Format countdown
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${secs}s`;
  };

  // Calculate stats
  const onlineAgents = agents.filter(a => a.status === 'online').length;
  const busyAgents = agents.filter(a => a.status === 'busy').length;
  const offlineAgents = agents.filter(a => a.status === 'offline').length;

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Initializing...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with connection status */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Mission Control</h1>
          <p className="text-slate-400 mt-1">Real-time ApexOS Operations Dashboard</p>
        </div>
        
        {/* Connection Status Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Gateway Status */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border",
            connection.connected 
              ? "bg-green-500/10 border-green-500/30 text-green-400" 
              : "bg-red-500/10 border-red-500/30 text-red-400"
          )}>
            {connection.connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            <div className="text-xs">
              <p className="font-medium">Gateway: {connection.connected ? 'CONNECTED' : 'DISCONNECTED'}</p>
              <p className="text-slate-500">{connection.url}</p>
            </div>
          </div>
          
          {/* Token Status */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-slate-800/50 border-slate-700">
            <div className={cn(
              "h-2 w-2 rounded-full",
              connection.tokenConfigured ? "bg-green-500" : "bg-red-500"
            )} />
            <span className="text-xs text-slate-400">
              Token: {connection.tokenConfigured ? 'Configured' : 'Missing'}
            </span>
          </div>
          
          {/* Last Fetch */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-slate-800/50 border-slate-700">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-400">
              Last: {lastFetch || 'Never'}
            </span>
          </div>
          
          {/* Auto-refresh */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-slate-800/50 border-slate-700">
            <span className="text-xs text-slate-400">
              Refresh: {formatCountdown(countdown)}
            </span>
          </div>
          
          {/* Connection Settings */}
          <ConnectionSettings />
          
          {/* Refresh Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            disabled={loading}
            className="border-slate-700"
          >
            <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && !connection.connected && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-red-400">Gateway Disconnected</h3>
            
            <>
              <p className="text-sm text-red-300/80 mt-1">{error}</p>
              <div className="mt-3 p-3 bg-slate-900/50 rounded text-xs text-slate-400">
                <p className="font-medium text-slate-300">Troubleshooting Tips:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Make sure the OpenClaw gateway is running</li>
                  <li>Check that the gateway URL is correct</li>
                  <li>Verify your network connection</li>
                  <li>Ensure the gateway SSL certificate is valid</li>
                </ul>
              </div>
            </>
            
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchData}
                className="border-slate-700 text-red-400 border-red-500/30"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
              <ConnectionSettings />
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Agents</p>
                <p className="text-2xl font-bold text-white">{onlineAgents + busyAgents}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Online</p>
                <p className="text-2xl font-bold text-white">{onlineAgents}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Busy</p>
                <p className="text-2xl font-bold text-white">{busyAgents}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Offline</p>
                <p className="text-2xl font-bold text-white">{offlineAgents}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-500/10 flex items-center justify-center">
                <WifiOff className="h-5 w-5 text-slate-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Status Section */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-400" />
              <CardTitle className="text-white">Live Agent Status</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-500/10 text-green-400">{onlineAgents} Online</Badge>
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400">{busyAgents} Busy</Badge>
              <Badge variant="secondary" className="bg-slate-500/10 text-slate-400">{offlineAgents} Offline</Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Loading State */}
          {loading && agents.length === 0 && (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 text-cyan-400 mx-auto mb-4 animate-spin" />
              <p className="text-slate-400">Connecting to OpenClaw gateway...</p>
            </div>
          )}
          
          {/* Empty State */}
          {!loading && agents.length === 0 && connection.connected && (
            <div className="text-center py-12 bg-slate-800/30 rounded-lg border border-dashed border-slate-700">
              <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300">No Active Sessions</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Connected to gateway, but no agents are currently running.
                Spawn a subagent to see activity here.
              </p>
            </div>
          )}
          
          {/* Disconnected State */}
          {!loading && !connection.connected && (
            <div className="text-center py-12 bg-slate-800/30 rounded-lg border border-dashed border-slate-700">
              <WifiOff className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300">Not Connected</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Cannot fetch real data - Gateway is disconnected.
                Check your connection settings and retry.
              </p>
              <div className="flex gap-2 justify-center mt-4">
                <Button variant="outline" size="sm" onClick={fetchData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                <ConnectionSettings />
              </div>
            </div>
          )}
          
          {/* Agent Cards */}
          {!loading && agents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <div 
                  key={agent.id} 
                  className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold",
                        agent.status === 'online' && "bg-green-500/20 text-green-400",
                        agent.status === 'busy' && "bg-yellow-500/20 text-yellow-400",
                        agent.status === 'offline' && "bg-slate-500/20 text-slate-400",
                      )}>
                        {agent.name[0]}
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{agent.name}</h4>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-xs capitalize",
                            agent.status === 'online' && "bg-green-500/10 text-green-400",
                            agent.status === 'busy' && "bg-yellow-500/10 text-yellow-400",
                            agent.status === 'offline' && "bg-slate-500/10 text-slate-400",
                          )}
                        >
                          {agent.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {agent.currentTask && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <p className="text-xs text-slate-500 mb-1">Current Task:</p>
                      <p className="text-sm text-slate-300 line-clamp-2">{agent.currentTask}</p>
                    </div>
                  )}
                  
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>ID: {agent.id.slice(0, 8)}...</span>
                    <span>{new Date(agent.lastActive).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Board Preview */}
      <Card className="mt-6 bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-cyan-400" />
              <CardTitle className="text-white">Task Board</CardTitle>
            </div>
            <Link href="/kanban">
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                View Full Board
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 bg-slate-800/30 rounded-lg border border-dashed border-slate-700">
            <p className="text-slate-500">
              Tasks are managed via real subagent sessions.
              {agents.length > 0 
                ? " Current subagent tasks shown above." 
                : " No active tasks."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
