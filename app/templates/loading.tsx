export default function Loading() {
  return (
    <main
      className="container loading-grid"
      aria-label="Loading templates"
      aria-busy="true"
    >
      <div className="template-grid">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="loading-skeleton" />
        ))}
      </div>
    </main>
  );
}
