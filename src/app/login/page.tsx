'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to dashboard - no auth required
    const timer = setTimeout(() => {
      router.push('/');
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-cyan-400" />
          </div>
          <CardTitle className="text-2xl text-white">Mission Control</CardTitle>
          <CardDescription className="text-slate-400">
            Public Dashboard Access
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-green-400 font-medium">No Login Required</p>
            <p className="text-sm text-slate-400 mt-1">
              This dashboard is publicly accessible.
            </p>
          </div>
          
          <p className="text-sm text-slate-500">
            Redirecting to dashboard...
          </p>
          
          <Button 
            onClick={() => router.push('/')}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            Go to Dashboard
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
