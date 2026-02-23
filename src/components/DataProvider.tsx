'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { Agent, Task } from '@/types';

interface DbAgent {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'offline' | 'busy';
  last_active: string;
  current_task: string | null;
  color: string;
}

interface DbTask {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  priority: string;
  assignee: string;
  assignee_name?: string;
  assignee_color?: string;
  created_at: string;
  updated_at: string;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { setAgents, setTasks } = useStore();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Load agents from JSON
        const agentsRes = await fetch('/data/agents.json');
        const dbAgents: DbAgent[] = agentsRes.ok ? await agentsRes.json() : [];
        
        // Map DB agents to Agent type
        const agents: Agent[] = dbAgents.map((a): Agent => ({
          id: a.id,
          name: a.name,
          role: a.role as Agent['role'],
          status: a.status,
          lastActive: a.last_active,
          currentTask: a.current_task || undefined,
          sessionKey: `agent:main:${a.id}`,
        }));
        
        // Load tasks from JSON
        const tasksRes = await fetch('/data/tasks.json');
        const dbTasks: DbTask[] = tasksRes.ok ? await tasksRes.json() : [];
        
        // Map DB tasks to Task type
        const tasks: Task[] = dbTasks.map((t): Task => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: mapStatus(t.status),
          priority: t.priority as 'P0' | 'P1' | 'P2' | 'P3',
          assignee: t.assignee,
          assigneeName: t.assignee_name,
          assigneeColor: t.assignee_color,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        }));
        
        setAgents(agents);
        setTasks(tasks);
        setLoaded(true);
        
        console.log('[DataProvider] Loaded:', agents.length, 'agents,', tasks.length, 'tasks');
      } catch (err) {
        console.error('[DataProvider] Failed to load data:', err);
        setLoaded(true);
      }
    }
    
    loadData();
  }, [setAgents, setTasks]);

  // Map database status to Task status
  function mapStatus(status: string): Task['status'] {
    switch (status) {
      case 'todo': return 'backlog';
      case 'in_progress': return 'in-progress';
      case 'review': return 'review';
      case 'done': return 'done';
      case 'blocked': return 'backlog';
      default: return 'backlog';
    }
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading Mission Control data...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
