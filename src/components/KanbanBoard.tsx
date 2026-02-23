'use client';

import { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task } from '@/types';
import { useStore } from '@/lib/store';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const columns: { id: Task['status']; title: string; color: string }[] = [
  { id: 'backlog', title: 'Backlog / Todo', color: 'bg-slate-500/10 border-slate-500/20' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-500/10 border-blue-500/20' },
  { id: 'review', title: 'Review', color: 'bg-yellow-500/10 border-yellow-500/20' },
  { id: 'done', title: 'Done', color: 'bg-green-500/10 border-green-500/20' },
];

export function KanbanBoard() {
  const { tasks, moveTask } = useStore();
  const [isDragging, setIsDragging] = useState(false);

  const onDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const onDragEnd = useCallback((result: DropResult) => {
    setIsDragging(false);
    
    if (!result.destination) return;

    const sourceColumn = result.source.droppableId as Task['status'];
    const destColumn = result.destination.droppableId as Task['status'];
    const taskId = result.draggableId;

    if (sourceColumn !== destColumn) {
      moveTask(taskId, destColumn);
    }
  }, [moveTask]);

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter((task) => task.status === status);
  };

  return (
    <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className={cn(
              'flex-shrink-0 w-80 flex flex-col rounded-lg border',
              column.color
            )}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-slate-200">{column.title}</h3>
                <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full">
                  {getTasksByStatus(column.id).length}
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                  <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-slate-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    'flex-1 p-2 space-y-2 min-h-[100px] transition-colors',
                    snapshot.isDraggingOver && 'bg-slate-800/50 rounded-lg'
                  )}
                >
                  {getTasksByStatus(column.id).map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                          }}
                          className={cn(
                            'transition-transform',
                            snapshot.isDragging && 'rotate-2 scale-105'
                          )}
                        >
                          <TaskCard task={task} compact />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
