"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Check, X, Wifi, RefreshCw, AlertTriangle, Terminal, Copy } from 'lucide-react';
import { getConfig, saveConfig, checkGatewayStatus, OpenClawConfig, executeCommand } from '@/lib/openclaw-client';
import { cn } from '@/lib/utils';

export function ConnectionSettings() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<OpenClawConfig>({
    gatewayUrl: 'wss://henal-open-claw.duckdns.org',
    gatewayToken: '37b8280cb7ebb287dc44db0d76befef976be004b5f25d1b3',
    autoRefresh: true,
    refreshInterval: 60,
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [cliTesting, setCliTesting] = useState(false);
  const [cliTestResult, setCliTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    const cfg = getConfig();
    setConfig(cfg);
  }, []);

  const handleSave = () => {
    saveConfig(config);
    setOpen(false);
    // Reload to apply new config
    window.location.reload();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testViaCli = async () => {
    setCliTesting(true);
    setCliTestResult(null);
    
    try {
      // Attempt to run openclaw session_status via available API
      const result = await executeCommand('openclaw session_status');
      
      if (result.success) {
        setCliTestResult({
          success: true,
          message: 'CLI connection successful!',
        });
      } else {
        setCliTestResult({
          success: false,
          message: result.error || 'CLI test failed',
        });
      }
    } catch (error) {
      setCliTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'CLI test failed',
      });
    } finally {
      setCliTesting(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const status = await checkGatewayStatus();
      
      if (status.connected) {
        setTestResult({
          success: true,
          message: `Connected! Response time: ${status.responseTime}ms`,
        });
      } else {
        setTestResult({
          success: false,
          message: status.error || 'Connection failed',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  if (!mounted) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-slate-700">
          <Settings className="h-4 w-4 mr-2" />
          Connection Settings
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-cyan-400" />
            OpenClaw Connection
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-400">Let&apos;s Encrypt SSL ✅</p>
                <p className="text-xs text-green-300/80 mt-1">
                  Port 443 (Standard HTTPS) — Secure connection to henal-open-claw.duckdns.org with trusted SSL certificate.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gatewayUrl" className="text-slate-300">
              Gateway URL
            </Label>
            <Input
              id="gatewayUrl"
              value={config.gatewayUrl}
              onChange={(e) => setConfig({ ...config, gatewayUrl: e.target.value })}
              placeholder="wss://gateway.example.com:8443"
              className="bg-slate-800 border-slate-700 text-white"
            />
            <p className="text-xs text-slate-500">
              WebSocket URL for the OpenClaw gateway (Port 443 is default for WSS)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gatewayToken" className="text-slate-300">
              Gateway Token
            </Label>
            <Input
              id="gatewayToken"
              type="password"
              value={config.gatewayToken}
              onChange={(e) => setConfig({ ...config, gatewayToken: e.target.value })}
              placeholder="Your gateway token"
              className="bg-slate-800 border-slate-700 text-white"
            />
            <p className="text-xs text-slate-500">
              Authentication token for the gateway (pre-configured)
            </p>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="autoRefresh" className="text-slate-300">
                Auto-refresh
              </Label>
              <p className="text-xs text-slate-500">
                Automatically refresh data
              </p>
            </div>
            <Switch
              id="autoRefresh"
              checked={config.autoRefresh}
              onCheckedChange={(checked) => setConfig({ ...config, autoRefresh: checked })}
            />
          </div>

          {config.autoRefresh && (
            <div className="space-y-2">
              <Label htmlFor="refreshInterval" className="text-slate-300">
                Refresh Interval (seconds)
              </Label>
              <Input
                id="refreshInterval"
                type="number"
                min={10}
                max={3600}
                value={config.refreshInterval}
                onChange={(e) => setConfig({ ...config, refreshInterval: parseInt(e.target.value) || 60 })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          )}

          {/* Test Connection */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={testConnection}
              disabled={testing}
              className="w-full border-slate-700"
            >
              {testing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wifi className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
            
            {testResult && (
              <div className={cn(
                "mt-3 p-3 rounded-lg flex items-center gap-2",
                testResult.success 
                  ? "bg-green-500/10 border border-green-500/30 text-green-400"
                  : "bg-red-500/10 border border-red-500/30 text-red-400"
              )}>
                {testResult.success ? (
                  <Check className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <X className="h-4 w-4 flex-shrink-0" />
                )}
                <span className="text-sm">{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Test via CLI */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={testViaCli}
              disabled={cliTesting}
              className="w-full border-slate-700 text-slate-300"
            >
              {cliTesting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Terminal className="h-4 w-4 mr-2" />
              )}
              Test via CLI
            </Button>
            
            {cliTestResult && (
              <div className={cn(
                "mt-3 p-3 rounded-lg flex items-center gap-2",
                cliTestResult.success 
                  ? "bg-green-500/10 border border-green-500/30 text-green-400"
                  : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
              )}>
                {cliTestResult.success ? (
                  <Check className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                )}
                <span className="text-sm">{cliTestResult.message}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700"
            >
              Save & Apply
            </Button>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500">
          <p>Default: wss://henal-open-claw.duckdns.org (Port 443)</p>
          <p className="mt-1">Connection stored locally in your browser.</p>
          <p className="mt-2 text-green-400">
            🔒 SSL: Let&apos;s Encrypt Port 443 ✅
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
