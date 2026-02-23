'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw, Wifi, WifiOff, Clock, AlertCircle, Play, Pause, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { openClawWS, getConnectionState, GatewayStatus } from '@/lib/openclaw-client';

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  status?: string;
}

export default function CronPage() {
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [connection, setConnection] = useState<GatewayStatus>(getConnectionState());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<string | null>(null);

  const fetchCronJobs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use persistent WebSocket
      if (openClawWS && openClawWS.isAuthenticated()) {
        const result = await openClawWS.sendRpc('cron.list', {});
        
        if (result.ok) {
          const jobs = result.payload?.jobs || result.payload || [];
          setCronJobs(jobs);
          setError(null);
        } else {
          // If cron.list doesn't exist, that's okay
          setCronJobs([]);
        }
      } else {
        setError('WebSocket not connected');
      }
      
      setConnection(getConnectionState());
      setLastFetch(new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }) + ' UTC');
    } catch (err) {
      // cron.list might not be available on all gateways
      setCronJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCronJobs();
    
    // Subscribe to updates
    if (openClawWS) {
      openClawWS.on('session_update', () => {
        fetchCronJobs();
      });
    }
  }, []);

  // Update connection status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setConnection(getConnectionState());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const formatSchedule = (schedule: string) => {
    // Convert cron expression to readable format
    if (schedule === '* * * * *') return 'Every minute';
    if (schedule === '*/5 * * * *') return 'Every 5 minutes';
    if (schedule === '0 * * * *') return 'Every hour';
    if (schedule === '0 0 * * *') return 'Daily at midnight';
    if (schedule === '0 9 * * *') return 'Daily at 9 AM';
    return schedule;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Cron Jobs</h1>
          <p className="text-slate-400 mt-1">Scheduled tasks and automated jobs</p>
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
            onClick={fetchCronJobs}
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
          </div>
        </div>
      )}

      {/* Cron Jobs List */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cyan-400" />
              <CardTitle className="text-white">Scheduled Jobs</CardTitle>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 text-cyan-400 mx-auto mb-4 animate-spin" />
              <p className="text-slate-400">Loading cron jobs...</p>
            </div>
          )}
          
          {/* Empty State - No cron available */}
          {!loading && cronJobs.length === 0 && (
            <div className="text-center py-12 bg-slate-800/30 rounded-lg border border-dashed border-slate-700">
              <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300">No Cron Jobs</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                {connection.connected 
                  ? "No scheduled jobs are configured on this gateway."
                  : "Connect to the gateway to view scheduled jobs."
                }
              </p>
            </div>
          )}
          
          {/* Cron Jobs Table */}
          {!loading && cronJobs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Name</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Schedule</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Last Run</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Next Run</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {cronJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-200">{job.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-xs text-cyan-400 bg-slate-800 px-2 py-1 rounded">
                          {job.schedule}
                        </code>
                        <span className="text-xs text-slate-500 ml-2">
                          ({formatSchedule(job.schedule)})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-xs",
                            job.enabled 
                              ? "bg-green-500/10 text-green-400" 
                              : "bg-slate-500/10 text-slate-400"
                          )}
                        >
                          {job.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-slate-500">
                          {job.lastRun 
                            ? new Date(job.lastRun).toLocaleString() 
                            : 'Never'
                          }
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-slate-500">
                          {job.nextRun 
                            ? new Date(job.nextRun).toLocaleString() 
                            : '-'
                          }
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            {job.enabled ? (
                              <Pause className="h-4 w-4 text-yellow-400" />
                            ) : (
                              <Play className="h-4 w-4 text-green-400" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
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
