'use client';

import { useEffect, useRef } from 'react';
import { Message, Conversation } from '@/types';
import { useStore } from '@/lib/store';
import { Card, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatRelativeTime, cn } from '@/lib/utils';
import { Send, ArrowLeft, MessageSquare } from 'lucide-react';
import { AGENT_ROLES } from '@/types';

interface ConversationThreadProps {
  conversation?: Conversation;
  messages?: Message[];
  showHeader?: boolean;
}

export function ConversationThread({ 
  conversation, 
  messages: propMessages,
  showHeader = true 
}: ConversationThreadProps) {
  const { 
    selectedConversation, 
    messages: storeMessages, 
    agents,
    selectConversation 
  } = useStore();
  
  const activeConversation = conversation || selectedConversation;
  const activeMessages = propMessages || storeMessages;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages]);

  if (!activeConversation) {
    return (
      <Card className="h-full bg-slate-900/50 border-slate-800 flex items-center justify-center">
        <div className="text-center p-8">
          <MessageSquare className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Select a conversation to view messages</p>
        </div>
      </Card>
    );
  }

  const getAgentById = (id: string) => agents.find((a) => a.id === id);

  return (
    <Card className="h-full bg-slate-900/50 border-slate-800 flex flex-col">
      {showHeader && (
        <CardHeader className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => selectConversation(null)}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex-1">
              <h3 className="font-semibold text-white">
                {activeConversation.participants.join(', ')}
              </h3>
              <p className="text-xs text-slate-500">
                {activeConversation.participantIds.length} participants
              </p>
            </div>
          </div>
        </CardHeader>
      )}
      
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {activeMessages.map((message, index) => {
            const sender = getAgentById(message.senderId);
            const isSystem = message.type === 'system';
            const showAvatar = index === 0 || activeMessages[index - 1].senderId !== message.senderId;
            
            return (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  isSystem && 'justify-center'
                )}
              >
                {!isSystem && (
                  <>
                    {showAvatar ? (
                      <Avatar className="h-8 w-8 mt-0.5">
                        <AvatarFallback 
                          className="text-xs font-medium"
                          style={{ 
                            backgroundColor: sender ? `${AGENT_ROLES[sender.role].color}30` : '#334155',
                            color: sender ? AGENT_ROLES[sender.role].color : '#94a3b8'
                          }}
                        >
                          {message.senderName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-8" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      {showAvatar && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-slate-200">
                            {message.senderName}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatRelativeTime(message.timestamp)}
                          </span>
                        </div>
                      )}
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  </>
                )}
                
                {isSystem && (
                  <div className="bg-slate-800/30 rounded-full px-3 py-1">
                    <p className="text-xs text-slate-500">{message.content}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-slate-800">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
          <Button size="icon" className="bg-cyan-600 hover:bg-cyan-700">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
