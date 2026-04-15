import React from 'react';
import { AgentCard } from './AgentCard';

interface DashboardProps {
  squad: any[];
  onUpdate: (id: string, updates: any) => void;
  onRemove: (id: string) => void;
  onSelectFolder: (id: string) => void;
  onSelectSkill: (id: string) => void;
  onReview: (agent: any) => void;
}

export function Dashboard({ squad, onUpdate, onRemove, onSelectFolder, onSelectSkill, onReview }: DashboardProps) {
  if (squad.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', gap: 16, textAlign: 'center' }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="64" height="64" style={{ opacity: 0.25 }}>
          <circle cx="50" cy="50" r="48" fill="#1a1a1a"/>
          <path d="M 2 50 A 48 48 0 0 1 98 50 Z" fill="#e53e3e"/>
          <path d="M 2 50 A 48 48 0 0 0 98 50 Z" fill="#f7f7f7"/>
          <rect x="2" y="45" width="96" height="10" fill="#1a1a1a"/>
          <circle cx="50" cy="50" r="14" fill="#1a1a1a"/>
          <circle cx="50" cy="50" r="9" fill="#ffffff"/>
          <path d="M 20 20 Q 35 10 55 18" stroke="rgba(255,255,255,0.4)" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>
        <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>No agents yet.<br/>Hit <strong style={{ color: '#9ca3af' }}>+</strong> to recruit your squad.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {squad.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onSelectFolder={onSelectFolder}
          onSelectSkill={onSelectSkill}
          onReview={onReview}
        />
      ))}
    </div>
  );
}
