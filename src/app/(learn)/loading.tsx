export default function Loading() {
  return (
    <div
      className="page-content"
      role="status"
      aria-label="Chargement du parcours"
    >
      <div className="loading-shimmer" />
      <div className="loading-shimmer" />
      <p className="muted">Ton parcours se prépare…</p>
    </div>
  );
}
