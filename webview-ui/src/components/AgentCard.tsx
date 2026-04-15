import React from 'react';

interface AgentCardProps {
  agent: any;
  onUpdate: (id: string, updates: any) => void;
  onRemove: (id: string) => void;
  onSelectFolder: (id: string) => void;
  onSelectSkill: (id: string) => void;
  onReview: (agent: any) => void;
}

const TYPE_COLORS: Record<string, { accent: string; glow: string; badge: string }> = {
  fire:     { accent: '#f97316', glow: 'rgba(249,115,22,0.25)',  badge: 'rgba(249,115,22,0.15)' },
  water:    { accent: '#60a5fa', glow: 'rgba(96,165,250,0.25)',  badge: 'rgba(96,165,250,0.15)' },
  grass:    { accent: '#4ade80', glow: 'rgba(74,222,128,0.25)',  badge: 'rgba(74,222,128,0.15)' },
  electric: { accent: '#facc15', glow: 'rgba(250,204,21,0.25)',  badge: 'rgba(250,204,21,0.15)' },
  psychic:  { accent: '#e879f9', glow: 'rgba(232,121,249,0.25)', badge: 'rgba(232,121,249,0.15)' },
  ice:      { accent: '#67e8f9', glow: 'rgba(103,232,249,0.25)', badge: 'rgba(103,232,249,0.15)' },
  dragon:   { accent: '#818cf8', glow: 'rgba(129,140,248,0.25)', badge: 'rgba(129,140,248,0.15)' },
  dark:     { accent: '#a78bfa', glow: 'rgba(167,139,250,0.25)', badge: 'rgba(167,139,250,0.15)' },
  normal:   { accent: '#d1d5db', glow: 'rgba(209,213,219,0.15)', badge: 'rgba(209,213,219,0.1)' },
};

function getTypeStyle(type: string) {
  return TYPE_COLORS[type] || TYPE_COLORS['normal'];
}

function basename(path?: string) {
  if (!path) return null;
  return path.split('/').pop() || path.split('\\').pop() || path;
}

export function AgentCard({ agent, onRemove, onSelectFolder, onSelectSkill, onReview }: AgentCardProps) {
  const ts = getTypeStyle(agent.type);
  const hasFolder = !!agent.folderPath;
  const hasSkill  = !!agent.skillPath;
  const isReady   = hasFolder && hasSkill;

  const card: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
    border: `1px solid rgba(255,255,255,0.1)`,
    borderRadius: 14,
    padding: '14px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: isReady ? `0 0 20px ${ts.glow}` : '0 2px 12px rgba(0,0,0,0.4)',
    transition: 'box-shadow 0.3s ease',
  };

  const accentBar: React.CSSProperties = {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%',
    height: 2,
    background: `linear-gradient(90deg, ${ts.accent}, transparent)`,
  };

  const row: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
  };

  const spriteWrap: React.CSSProperties = {
    width: 54, height: 54,
    background: `radial-gradient(circle at 50% 60%, ${ts.badge} 0%, transparent 70%)`,
    borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  };

  const badge: React.CSSProperties = {
    display: 'inline-block',
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: ts.accent,
    background: ts.badge,
    borderRadius: 4,
    padding: '2px 6px',
    marginTop: 3,
  };

  const rowBtn = (filled: boolean): React.CSSProperties => ({
    flex: 1,
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 10px',
    background: filled ? 'rgba(255,255,255,0.07)' : 'transparent',
    border: filled ? '1px solid rgba(255,255,255,0.12)' : '1px dashed rgba(255,255,255,0.18)',
    borderRadius: 8,
    color: filled ? '#e5e7eb' : '#6b7280',
    fontSize: 10,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left' as const,
    letterSpacing: '0.02em',
    transition: 'all 0.15s ease',
    overflow: 'hidden',
    whiteSpace: 'nowrap' as const,
  });

  const launchBtn: React.CSSProperties = isReady ? {
    width: '100%',
    padding: '10px',
    borderRadius: 10,
    border: 'none',
    background: `linear-gradient(135deg, ${ts.accent} 0%, ${ts.accent}cc 100%)`,
    color: '#000',
    fontWeight: 800,
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    boxShadow: `0 4px 16px ${ts.glow}`,
    transition: 'opacity 0.15s ease',
  } : {
    width: '100%',
    padding: '10px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.07)',
    background: 'rgba(255,255,255,0.04)',
    color: '#4b5563',
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'not-allowed',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  };

  return (
    <div style={card}>
      <div style={accentBar} />

      {/* Header row */}
      <div style={{ ...row, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={spriteWrap}>
            <img
              src={agent.sprite}
              alt={agent.name}
              style={{ width: 44, height: 44, imageRendering: 'pixelated', filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.15))' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f9fafb', letterSpacing: '-0.3px' }}>
              {agent.name}
            </div>
            <span style={badge}>{agent.type} node</span>
          </div>
        </div>
        <button
          onClick={() => onRemove(agent.id)}
          style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: 4, fontSize: 14, lineHeight: 1 }}
          title="Remove agent"
        >
          ✕
        </button>
      </div>

      {/* Assign row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button style={rowBtn(hasFolder)} onClick={() => onSelectFolder(agent.id)} title="Map a folder">
          <span style={{ flexShrink: 0 }}>📂</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {hasFolder ? basename(agent.folderPath) : 'Map Folder'}
          </span>
        </button>
        <button style={rowBtn(hasSkill)} onClick={() => onSelectSkill(agent.id)} title="Assign a skill manual">
          <span style={{ flexShrink: 0 }}>📄</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {hasSkill ? basename(agent.skillPath) : 'Assign Skill'}
          </span>
        </button>
      </div>

      {/* Status hint */}
      {!isReady && (
        <div style={{ fontSize: 9, color: '#4b5563', textAlign: 'center', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {!hasFolder && !hasSkill ? '⚡ Assign folder + skill to activate' 
            : !hasFolder ? '📂 Still needs a folder' 
            : '📄 Still needs a skill manual'}
        </div>
      )}

      {/* Launch button */}
      <button
        style={launchBtn}
        disabled={!isReady}
        onClick={() => isReady && onReview(agent)}
      >
        <span>▶</span>
        {isReady ? `${agent.name} — Launch Quest` : 'Waiting for assignment...'}
      </button>
    </div>
  );
}
