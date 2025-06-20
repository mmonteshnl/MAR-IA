"use client";

import React, { ReactNode } from 'react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { HelpCircle, Info } from 'lucide-react';

interface ContextualTooltipProps {
  children: ReactNode;
  content: string | ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  showIcon?: boolean;
  iconType?: 'help' | 'info';
  className?: string;
  triggerClassName?: string;
}

export function ContextualTooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  delayDuration = 300,
  showIcon = false,
  iconType = 'help',
  className = '',
  triggerClassName = ''
}: ContextualTooltipProps) {
  const IconComponent = iconType === 'help' ? HelpCircle : Info;

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1.5 ${triggerClassName}`}>
            {children}
            {showIcon && (
              <IconComponent className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align}
          className={`max-w-xs ${className}`}
        >
          {typeof content === 'string' ? (
            <p className="text-sm">{content}</p>
          ) : (
            content
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}