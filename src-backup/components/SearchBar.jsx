import { useState, useTransition, useMemo } from 'react';

const PREDEFINED_DESTINATIONS = [
  { name: "Mysore Palace", address: "Sayyaji Rao Rd, Agrahara, Mysuru", lat: 12.3051, lng: 76.6551, id: "palace" },
  { name: "Chamundi Hill Temple", address: "Chamundi Hill Rd, Mysuru", lat: 12.2743, lng: 76.6780, id: "chamundi" },
  { name: "Brindavan Gardens (KRS)", address: "KRS Dam Road, Mysuru", lat: 12.4259, lng: 76.5724, id: "krs" },
  { name: "Mysuru Sri Chamarajendra Zoo", address: "Indiranagar, Mysuru", lat: 12.3023, lng: 76.6660, id: "zoo" },
  { name: "GRS Fantasy Park", address: "KRS Rd, Metagalli, Mysuru", lat: 12.3552, lng: 76.6342, id: "grs" },
  { name: "Lalitha Mahal Palace", address: "Siddhartha Layout, Mysuru", lat: 12.2965, lng: 76.6853, id: "lalitha" },
  { name: "St. Philomena's Cathedral", address: "Lashkar Mohalla, Mysuru", lat: 12.3209, lng: 76.6601, id: "philom" },
  { name: "Infosys Mysore Campus", address: "Hebbal Industrial Area, Mysuru", lat: 12.3512, lng: 76.5925, id: "infy" }
];

export default function SearchBar({ onSearch, onClear, loading }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (val.trim() === '') {
      setSuggestions([]);
      return;
    }

    startTransition(() => {
      // Filter list of predefined destinations
      const filtered = PREDEFINED_DESTINATIONS.filter(
        d =>
          d.name.toLowerCase().includes(val.toLowerCase()) ||
          d.address.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered);
    });
  };

  const handleSelect = (dest) => {
    setQuery(dest.name);
    setSuggestions([]);
    if (onSearch) {
      onSearch({
        name: dest.name,
        address: dest.address,
        lat: dest.lat,
        lng: dest.lng,
        placeId: dest.id,
      });
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    if (onClear) onClear();
  };

  return (
    <div style={{
      position: 'absolute', top: 16, left: 16, right: 16, zIndex: 1001,
    }}>
      <div style={{ position: 'relative' }}>
        {/* Search icon */}
        <div style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-muted)', fontSize: 16, pointerEvents: 'none',
        }}>
          🔍
        </div>

        <input
          type="text"
          className="search-input"
          placeholder="Search destination in Mysuru..."
          value={query}
          onChange={handleInputChange}
          id="search-destination"
          autoComplete="off"
        />

        {query && (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: 16, padding: 4,
            }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Suggestions dropdown dropdown list */}
      {suggestions.length > 0 && (
        <div className="glass-card" style={{
          marginTop: 6,
          maxHeight: 220,
          overflowY: 'auto',
          padding: '6px 0',
          position: 'relative',
          boxShadow: '0 4px 20px var(--glass-shadow)',
          borderRadius: 'var(--radius-sm)',
        }}>
          {suggestions.map((dest) => (
            <div
              key={dest.id}
              onClick={() => handleSelect(dest)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
              }}
              className="suggestion-item"
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 14 }}>📍</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{dest.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{dest.address}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="glass-card" style={{
          marginTop: 8, padding: '8px 16px',
          fontSize: 13, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>🔄</span>
          <span>Loading safety routes...</span>
        </div>
      )}
    </div>
  );
}
