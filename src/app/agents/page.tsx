'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FolderOpen, RefreshCw, Wifi, WifiOff, Clock, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchSubagents, checkGatewayStatus, Agent, GatewayStatus } from '@/lib/openclaw-client';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [connection, setConnection] = useState<GatewayStatus>({
    connected: false,
    url: 'ws://24.83.78.218:18789',
    tokenConfigured: true,
    lastFetch: null,
    error: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check gateway status
      const statusData = await checkGatewayStatus();
      setConnection(statusData);

      if (statusData.connected) {
        // Fetch agents
        const { agents: realAgents, error: subagentError } = await fetchSubagents();
        
        if (subagentError) {
          setError(subagentError);
        } else {
          setAgents(realAgents);
          setError(null);
        }
      } else {
        setError(statusData.error || 'Gateway disconnected');
        setAgents([]);
      }
      
      setLastFetch(new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }) + ' UTC');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setConnection(prev => ({ ...prev, connected: false, error: String(err) }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Connection Status */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Agents</h1>
          <p className="text-slate-400 mt-1">Manage and monitor ApexOS agents</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Gateway Status */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border",
            connection.connected 
              ? "bg-green-500/10 border-green-500/30 text-green-400" 
              : "bg-red-500/10 border-red-500/30 text-red-400"
          )}>
            {connection.connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            <span className="text-xs font-medium">
              {connection.connected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-slate-800/50 border-slate-700">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-400">
              Last: {lastFetch || 'Never'}
            </span>
          </div>
          
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
          <div>
            <h3 className="font-medium text-red-400">Gateway Disconnected</h3>
            <p className="text-sm text-red-300/80 mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchData}
              className="mt-3 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Agent List */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-cyan-400" />
              <CardTitle className="text-white">Active Subagents</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-500/10 text-green-400">
                {agents.filter(a => a.status === 'online').length} Online
              </Badge>
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400">
                {agents.filter(a => a.status === 'busy').length} Busy
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Empty State */}
          {agents.length === 0 && !loading && (
            <div className="text-center py-12 bg-slate-800/30 rounded-lg border border-dashed border-slate-700">
              <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300">No Active Agents</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                {connection.connected 
                  ? "No agents are currently running. Spawn a subagent to see activity here."
                  : "Cannot fetch real data - Gateway is disconnected. Check your connection settings."
                }
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchData}
                className="mt-4 border-slate-600 text-slate-300"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          )}
          
          {/* Loading */}
          {loading && agents.length === 0 && (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 text-cyan-400 mx-auto mb-4 animate-spin" />
              <p className="text-slate-400">Connecting to OpenClaw gateway...</p>
            </div>
          )}
          
          {/* Agent Cards */}
          {!loading && agents.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {agents.map((agent) => (
                <div 
                  key={agent.id} 
                  className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold",
                        agent.status === 'online' && "bg-green-500/20 text-green-400",
                        agent.status === 'busy' && "bg-yellow-500/20 text-yellow-400",
                        agent.status === 'offline' && "bg-slate-500/20 text-slate-400",
                      )}>
                        {agent.name[0]}
                      </div>
                      <div>
                        <h4 className="font-medium text-white text-lg">{agent.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
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
                  </div>
                  
                  {agent.currentTask && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <p className="text-xs text-slate-500 mb-1">Current Task:</p>
                      <p className="text-sm text-slate-300">{agent.currentTask}</p>
                    </div>
                  )}
                  
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>Session: {agent.sessionKey?.slice(0, 20)}...</span>
                    <span>{new Date(agent.lastActive).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
