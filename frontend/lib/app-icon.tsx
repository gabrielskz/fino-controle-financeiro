export function AppIconArtwork({ size }: { size: number }) {
  return <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#17231d", color: "#17231d" }}>
    <div style={{ width: size * 0.64, height: size * 0.64, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: size * 0.2, background: "#d8ff65", boxShadow: `0 ${size * 0.035}px ${size * 0.09}px rgba(0, 0, 0, 0.22)` }}>
      <div style={{ width: size * 0.4, height: size * 0.4, display: "flex", alignItems: "center", justifyContent: "center", border: `${size * 0.035}px solid #17231d`, borderRadius: "50%", fontFamily: "Arial, sans-serif", fontSize: size * 0.25, fontWeight: 800, lineHeight: 1 }}>$</div>
    </div>
  </div>;
}
