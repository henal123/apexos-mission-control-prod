#!/usr/bin/env node
/**
 * Export SQLite database to JSON for static build
 * Falls back to demo data if database not available (e.g., on Vercel)
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = '/root/.openclaw/workspace/apexos-db/mission-control.db';
const OUTPUT_DIR = path.join(__dirname, '../public/data');

// Demo data - matches the C-suite agents
const DEMO_AGENTS = [
  { id: "henal", name: "Henal", role: "CEO", status: "online", last_active: new Date().toISOString(), current_task: "Reviewing Mission Control", color: "#8B5CF6" },
  { id: "atlas", name: "Atlas", role: "COO", status: "online", last_active: new Date().toISOString(), current_task: "System optimization", color: "#3B82F6" },
  { id: "velocity", name: "Velocity", role: "CTO", status: "busy", last_active: new Date().toISOString(), current_task: "Fixing deployment", color: "#10B981" },
  { id: "monarch", name: "Monarch", role: "CFO", status: "online", last_active: new Date().toISOString(), current_task: null, color: "#F59E0B" },
  { id: "growth", name: "Growth", role: "CMO", status: "online", last_active: new Date().toISOString(), current_task: null, color: "#EC4899" },
  { id: "nova", name: "Nova", role: "CHRO", status: "online", last_active: new Date().toISOString(), current_task: null, color: "#6366F1" }
];

const DEMO_TASKS = [
  { id: "task-1", title: "Fix Mission Control Path Aliases", description: "Resolve @/components and @/lib imports for Vercel deployment", status: "in_progress", priority: "P0", assignee: "velocity", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "task-2", title: "Deploy to Production", description: "Push working build to Vercel with real data", status: "in_progress", priority: "P0", assignee: "velocity", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "task-3", title: "Connect SQLite Database", description: "Read real agent and task data from SQLite", status: "blocked", priority: "P1", assignee: "atlas", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "task-4", title: "C-Suite Daily Brief", description: "Generate morning briefing for CEO", status: "todo", priority: "P1", assignee: "atlas", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

let sqlite3 = null;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (e) {
  console.log('sqlite3 not available, will use demo data');
}

async function exportDatabase() {
  console.log('Exporting Mission Control database...');
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let agents = DEMO_AGENTS;
  let tasks = DEMO_TASKS;
  let sessions = [];
  let cronJobs = [];
  let usedDemo = false;

  // Try to connect to database
  if (sqlite3 && fs.existsSync(DB_PATH)) {
    try {
      const db = new sqlite3.Database(DB_PATH);

      // Export agents
      agents = await new Promise((resolve) => {
        db.all('SELECT * FROM agents ORDER BY last_active DESC', [], (err, rows) => {
          if (err) resolve(DEMO_AGENTS);
          else resolve(rows.length ? rows : DEMO_AGENTS);
        });
      });

      // Export tasks with join
      tasks = await new Promise((resolve) => {
        db.all(`
          SELECT t.*, a.name as assignee_name, a.color as assignee_color 
          FROM tasks t 
          LEFT JOIN agents a ON t.assignee = a.id 
          ORDER BY t.updated_at DESC
        `, [], (err, rows) => {
          if (err) resolve(DEMO_TASKS);
          else resolve(rows.length ? rows : DEMO_TASKS);
        });
      });

      // Export sessions
      sessions = await new Promise((resolve) => {
        db.all('SELECT * FROM sessions ORDER BY start_time DESC', [], (err, rows) => {
          resolve(rows || []);
        });
      });

      // Export cron jobs
      cronJobs = await new Promise((resolve) => {
        db.all('SELECT * FROM cron_jobs ORDER BY next_run ASC', [], (err, rows) => {
          resolve(rows || []);
        });
      });

      db.close();
      console.log('✓ Connected to SQLite database');
    } catch (err) {
      console.log('⚠ Database error, using demo data:', err.message);
      usedDemo = true;
    }
  } else {
    console.log('⚠ Database not found at:', DB_PATH);
    console.log('  Using DEMO data for static build');
    usedDemo = true;
  }

  // Process tasks to ensure proper format
  const processedTasks = tasks.map(t => ({
    ...t,
    assignee_name: t.assignee_name || getAgentName(t.assignee),
    assignee_color: t.assignee_color || getAgentColor(t.assignee)
  }));

  // Write JSON files
  fs.writeFileSync(path.join(OUTPUT_DIR, 'agents.json'), JSON.stringify(agents, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'tasks.json'), JSON.stringify(processedTasks, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'sessions.json'), JSON.stringify(sessions, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'cron-jobs.json'), JSON.stringify(cronJobs, null, 2));

  // Write manifest
  const manifest = {
    exportedAt: new Date().toISOString(),
    source: usedDemo ? 'demo' : 'sqlite',
    dbPath: DB_PATH,
    counts: {
      agents: agents.length,
      tasks: tasks.length,
      sessions: sessions.length,
      cronJobs: cronJobs.length
    }
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`\n✓ Export complete:`);
  console.log(`  - ${agents.length} agents`);
  console.log(`  - ${tasks.length} tasks`);
  console.log(`  - ${sessions.length} sessions`);
  console.log(`  - ${cronJobs.length} cron jobs`);
  console.log(`  Source: ${usedDemo ? 'DEMO DATA' : 'SQLite Database'}`);
  console.log(`  Output: ${OUTPUT_DIR}\n`);
}

function getAgentName(id) {
  const agent = DEMO_AGENTS.find(a => a.id === id);
  return agent ? agent.name : id;
}

function getAgentColor(id) {
  const agent = DEMO_AGENTS.find(a => a.id === id);
  return agent ? agent.color : '#64748b';
}

exportDatabase().catch(err => {
  console.error('Export failed:', err);
  // Create empty files as fallback
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, 'agents.json'), JSON.stringify(DEMO_AGENTS, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'tasks.json'), JSON.stringify(DEMO_TASKS, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'sessions.json'), JSON.stringify([], null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'cron-jobs.json'), JSON.stringify([], null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify({ exportedAt: new Date().toISOString(), source: 'fallback' }, null, 2));
  console.log('Created fallback demo data files');
});
