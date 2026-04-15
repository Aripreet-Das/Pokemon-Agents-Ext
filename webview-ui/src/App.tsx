import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Pokedex } from './components/Pokedex';
import { Dashboard } from './components/Dashboard';
import { Trophy, Plus } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  type: string;
  sprite: string;
  folderPath?: string;
  skillPath?: string;
  level: number;
}

// VS Code API — acquired once at module level to avoid re-instantiation
const vscode = (window as any).acquireVsCodeApi
  ? (window as any).acquireVsCodeApi()
  : { postMessage: (msg: any) => console.log('Mock PostMessage:', msg) };

export default function App() {
  const [squad, setSquad] = useState<Agent[]>([]);
  const [isPokedexOpen, setIsPokedexOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Use a ref so the message listener always has the current agent id
  // without needing to be re-registered when state changes
  const pendingAgentIdRef = useRef<string | null>(null);

  // Persist to VS Code global state
  const persist = useCallback((newSquad: Agent[]) => {
    vscode.postMessage({ type: 'saveSquad', squad: newSquad });
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      switch (message.type) {
        case 'squadLoaded':
          setSquad(message.squad || []);
          setLoading(false);
          break;

        case 'folderSelected': {
          const agentId = pendingAgentIdRef.current;
          if (!agentId || !message.path) break;
          pendingAgentIdRef.current = null;
          // Functional update — always works on latest state
          setSquad(prev => {
            const updated = prev.map(a =>
              a.id === agentId ? { ...a, folderPath: message.path } : a
            );
            persist(updated);
            return updated;
          });
          break;
        }

        case 'skillSelected': {
          const agentId = pendingAgentIdRef.current;
          if (!agentId || !message.path) break;
          pendingAgentIdRef.current = null;
          setSquad(prev => {
            const updated = prev.map(a =>
              a.id === agentId ? { ...a, skillPath: message.path } : a
            );
            persist(updated);
            return updated;
          });
          break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    vscode.postMessage({ type: 'loadSquad' });
    return () => window.removeEventListener('message', handleMessage);
  }, [persist]);

  const addAgent = (pokemon: any) => {
    const sprite =
      pokemon.sprites?.versions?.['generation-v']?.['black-white']?.animated?.front_default
      || pokemon.sprites?.front_default
      || '';

    const newAgent: Agent = {
      id: Math.random().toString(36).substr(2, 9),
      name: pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1),
      type: pokemon.types[0].type.name,
      sprite,
      level: 5,
    };

    setSquad(prev => {
      const updated = [...prev, newAgent];
      persist(updated);
      return updated;
    });
    setIsPokedexOpen(false);
  };

  const updateAgent = (id: string, updates: Partial<Agent>) => {
    setSquad(prev => {
      const updated = prev.map(a => (a.id === id ? { ...a, ...updates } : a));
      persist(updated);
      return updated;
    });
  };

  const removeAgent = (id: string) => {
    setSquad(prev => {
      const updated = prev.filter(a => a.id !== id);
      persist(updated);
      return updated;
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 24, height: 24, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '100vh' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: 0, letterSpacing: '-0.5px' }}>
            PokéDex
          </h1>
          <p style={{ fontSize: 10, color: '#6b7280', margin: 0, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ⚑ Lead Architect Trainer
          </p>
        </div>
        <button
          onClick={() => setIsPokedexOpen(true)}
          title="Add Sub-Agent"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            color: 'white',
            width: 32,
            height: 32,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 300,
          }}
        >
          +
        </button>
      </header>

      <Dashboard
        squad={squad}
        onUpdate={updateAgent}
        onRemove={removeAgent}
        onSelectFolder={(id) => {
          pendingAgentIdRef.current = id;
          vscode.postMessage({ type: 'selectFolder', agentId: id });
        }}
        onSelectSkill={(id) => {
          pendingAgentIdRef.current = id;
          vscode.postMessage({ type: 'selectSkill', agentId: id });
        }}
        onReview={(agent) => {
          vscode.postMessage({ type: 'triggerReview', agent });
        }}
      />

      {isPokedexOpen && (
        <Pokedex
          onSelect={addAgent}
          onClose={() => setIsPokedexOpen(false)}
        />
      )}
    </div>
  );
}
