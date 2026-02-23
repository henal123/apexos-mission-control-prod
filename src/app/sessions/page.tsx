'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Terminal, RefreshCw, Wifi, WifiOff, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { openClawWS, getConnectionState, GatewayStatus } from '@/lib/openclaw-client';

interface Session {
  key: string;
  label?: string;
  task?: string;
  status: string;
  created_at: string;
  last_activity?: string;
  metadata?: any;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [connection, setConnection] = useState<GatewayStatus>(getConnectionState());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use persistent WebSocket
      if (openClawWS && openClawWS.isAuthenticated()) {
        const result = await openClawWS.sendRpc('sessions.list', {});
        
        if (result.ok) {
          const sessionsData = result.payload?.sessions || result.payload || [];
          setSessions(sessionsData);
          setError(null);
        } else {
          setError(result.error?.message || 'Failed to fetch sessions');
        }
      } else {
        setError('WebSocket not connected');
      }
      
      setConnection(getConnectionState());
      setLastFetch(new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }) + ' UTC');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    
    // Subscribe to session updates
    if (openClawWS) {
      openClawWS.on('session_update', () => {
        fetchSessions();
      });
    }
    
    return () => {
      // Cleanup
    };
  }, []);

  // Update connection status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setConnection(getConnectionState());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const formatSessionKey = (key: string) => {
    if (!key) return 'Unknown';
    const parts = key.split(':');
    return parts[parts.length - 1]?.slice(0, 8) || 'Unknown';
  };

  const getSessionType = (key: string, label?: string) => {
    if (label?.toLowerCase().includes('cron')) return 'Cron';
    if (key?.toLowerCase().includes('cron')) return 'Cron';
    if (label?.toLowerCase().includes('subagent')) return 'Subagent';
    if (key?.toLowerCase().includes('subagent')) return 'Subagent';
    if (key?.toLowerCase().includes('main')) return 'Main';
    return 'Session';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Sessions</h1>
          <p className="text-slate-400 mt-1">Active OpenClaw sessions and subagents</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Connection Status */}
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
            onClick={fetchSessions}
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
              onClick={fetchSessions}
              className="mt-3 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-cyan-400" />
              <CardTitle className="text-white">Active Sessions</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-400">
                {sessions.length} Total
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Loading */}
          {loading && sessions.length === 0 && (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 text-cyan-400 mx-auto mb-4 animate-spin" />
              <p className="text-slate-400">Loading sessions...</p>
            </div>
          )}
          
          {/* Empty State */}
          {!loading && sessions.length === 0 && connection.connected && (
            <div className="text-center py-12 bg-slate-800/30 rounded-lg border border-dashed border-slate-700">
              <Terminal className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300">No Active Sessions</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                No sessions are currently running on the OpenClaw gateway.
              </p>
            </div>
          )}
          
          {/* Sessions Table */}
          {!loading && sessions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">ID</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Label</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sessions.map((session) => (
                    <tr key={session.key} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-xs",
                            getSessionType(session.key, session.label) === 'Cron' && "bg-purple-500/10 text-purple-400",
                            getSessionType(session.key, session.label) === 'Subagent' && "bg-blue-500/10 text-blue-400",
                            getSessionType(session.key, session.label) === 'Main' && "bg-green-500/10 text-green-400",
                          )}
                        >
                          {getSessionType(session.key, session.label)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-xs text-cyan-400 bg-slate-800 px-2 py-1 rounded">
                          {formatSessionKey(session.key)}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-slate-300 line-clamp-1">
                          {session.label || session.task || 'No label'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-slate-400 uppercase">{session.status}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-slate-500">
                          {new Date(session.created_at).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
