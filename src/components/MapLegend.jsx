export default function MapLegend({ visible = true, mapMode = 'mysuru' }) {
  if (!visible) return null;

  return (
    <div className="absolute bottom-20 left-4 right-4 z-[990] max-w-[430px] mx-auto bg-[#121212]/95 border border-white/10 p-3.5 rounded-xl shadow-2xl animate-fade-in-up font-sans">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 text-white/50">
        Safety Net Legend
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] uppercase font-bold tracking-wider">
        <LegendRow 
          color="linear-gradient(90deg, #FFC200, #FF9000, #FF4D00)" 
          label={mapMode === 'karnataka' ? 'Grid cell risk score' : 'Historical accident density'} 
          type="gradient" 
        />
        <LegendRow color="#FFC200" label="Low Proximity Warning" />
        <LegendRow color="#FF9000" label="Active Community Alert" />
        <LegendRow color="#FF4D00" label="High Proximity Threat" />
        <LegendRow color="#8b5cf6" label="Blind Spot Corridor" />
        <LegendRow color="#3b82f6" label="Active GPS Node" />
      </div>

      <div className="mt-2.5 pt-2 border-t border-white/5 text-[9px] text-white/40 font-medium leading-relaxed">
        Road safety index overlays derived from historical Mysuru accident datasets · Under continuous Firestore community updates.
      </div>
    </div>
  );
}

function LegendRow({ color, label, type }) {
  return (
    <div className="flex items-center gap-2">
      {type === 'gradient' ? (
        <div 
          className="w-7 h-1.5 rounded-full shrink-0" 
          style={{ background: color }} 
        />
      ) : (
        <div 
          className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20" 
          style={{ backgroundColor: color }} 
        />
      )}
      <span className="text-white/80">{label}</span>
    </div>
  );
}
