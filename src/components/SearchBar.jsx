import { useState, useTransition } from 'react';
import { Search, X, MapPin, Loader2 } from 'lucide-react';

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
    <div className="absolute top-4 left-4 right-4 z-[1001] max-w-[430px] mx-auto">
      <div className="relative flex items-center">
        {/* Search icon */}
        <Search className="absolute left-4 w-4 h-4 text-white/40" />

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search destination in Mysuru..."
          className="w-full bg-[#121212]/95 border border-white/10 hover:border-white/20 focus:border-[#FF4D00] rounded-xl pl-11 pr-10 py-3 text-xs font-black uppercase tracking-wider text-white placeholder-white/30 shadow-2xl focus:outline-none transition-all duration-200"
          id="search-destination"
          autoComplete="off"
        />

        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Suggestions list */}
      {suggestions.length > 0 && (
        <div className="mt-2 bg-[#121212]/95 border border-white/10 rounded-xl max-h-[220px] overflow-y-auto shadow-2xl animate-fade-in divide-y divide-[#1D1D1D]">
          {suggestions.map((dest) => (
            <div
              key={dest.id}
              onClick={() => handleSelect(dest)}
              className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-white/5 transition-colors group"
            >
              <MapPin className="w-4 h-4 text-[#FF4D00] mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-black uppercase tracking-tight text-white">{dest.name}</div>
                <div className="text-[10px] text-white/40 mt-0.5 font-medium">{dest.address}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="mt-2 bg-[#121212]/95 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl animate-pulse">
          <Loader2 className="w-4 h-4 text-[#FF4D00] animate-spin" />
          <span className="text-[11px] font-black uppercase tracking-wider text-white/60">Loading RAAHI corridor routes...</span>
        </div>
      )}
    </div>
  );
}
