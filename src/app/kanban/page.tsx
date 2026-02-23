'use client';

import { KanbanBoard } from '@/components/KanbanBoard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Layout } from 'lucide-react';
import Link from 'next/link';

export default function KanbanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Task Board</h1>
          <p className="text-slate-400">Manage tasks across all agents</p>
        </div>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-cyan-400" />
            <CardTitle className="text-white">Kanban Board</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[600px]">
            <KanbanBoard />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
