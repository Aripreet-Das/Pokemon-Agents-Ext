import React, { useState, useEffect } from 'react';

interface PokedexProps {
  onSelect: (pokemon: any) => void;
  onClose: () => void;
}

// Standard Pokéball SVG — matching the user's provided image
function PokedexLogoSVG() {
  return (
    <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer black ring */}
      <circle cx="50" cy="50" r="48" fill="black" />
      {/* Top half - Red */}
      <path d="M50 2C23.5 2 2 23.5 2 50h96C98 23.5 76.5 2 50 2z" fill="#FF0000" />
      {/* Bottom half - White */}
      <path d="M50 98c26.5 0 48-21.5 48-48H2c0 26.5 21.5 48 48 48z" fill="#FFFFFF" />
      {/* Center Dividing line */}
      <rect x="2" y="47" width="96" height="6" fill="black" />
      {/* Center button outer */}
      <circle cx="50" cy="50" r="14" fill="black" />
      {/* Center button inner */}
      <circle cx="50" cy="50" r="8" fill="white" />
      {/* Center button smallest ring */}
      <circle cx="50" cy="50" r="6" fill="none" stroke="#ddd" strokeWidth="0.5" />
    </svg>
  );
}

export function Pokedex({ onSelect, onClose }: PokedexProps) {
  const [search, setSearch] = useState('');
  const [pokemon, setPokemon] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPokemon() {
      try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
        const data = await response.json();
        const details = await Promise.all(
          data.results.map((p: any) => fetch(p.url).then(res => res.json()))
        );
        setPokemon(details);
      } catch (error) {
        console.error('Failed to fetch pokemon:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPokemon();
  }, []);

  const filtered = pokemon.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 50,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(6px)',
    display: 'flex', flexDirection: 'column',
    padding: 12,
  };

  const panel: React.CSSProperties = {
    flex: 1,
    background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 16,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
  };

  const header: React.CSSProperties = {
    padding: '12px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'rgba(0,0,0,0.4)',
  };

  const closeBtn: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, color: '#9ca3af',
    width: 28, height: 28,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, lineHeight: 1,
  };

  const searchWrap: React.CSSProperties = {
    padding: '10px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(0,0,0,0.2)',
  };

  const searchInput: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '8px 12px 8px 34px',
    fontSize: 12, color: 'white',
    outline: 'none',
    fontFamily: 'inherit',
  };

  const grid: React.CSSProperties = {
    flex: 1, overflowY: 'auto',
    padding: 12,
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    alignContent: 'start',
  };

  const pokeBtn: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '8px 4px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  return (
    <div style={overlay}>
      <div style={panel}>
        {/* Header */}
        <div style={header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PokedexLogoSVG />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>
                PokéDex
              </div>
              <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Recruit Sub-Agents
              </div>
            </div>
          </div>
          <button style={closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Search */}
        <div style={searchWrap}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontSize: 13 }}>🔍</span>
            <input
              autoFocus
              type="text"
              placeholder="Search Pokémon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={searchInput}
            />
          </div>
        </div>

        {/* Grid */}
        <div style={grid}>
          {loading ? (
            <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '40px 0', opacity: 0.5 }}>
              <div style={{ width: 20, height: 20, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>Scanning Network...</span>
            </div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                style={pokeBtn}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
              >
                <img
                  src={p.sprites.front_default}
                  alt={p.name}
                  style={{ width: 52, height: 52, imageRendering: 'pixelated', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
                />
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#9ca3af', marginTop: 2, width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
