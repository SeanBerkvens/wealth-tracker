export default function NewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">News</h1>
        <p className="mt-1 text-muted-foreground text-lg">
          Latest market news and updates
        </p>
      </div>

      <div className="rounded-2xl bg-card border border-border shadow-sm p-12 flex items-center justify-center">
        <p className="text-muted-foreground text-lg">
          Coming soon...
        </p>
      </div>
    </div>
  );
}