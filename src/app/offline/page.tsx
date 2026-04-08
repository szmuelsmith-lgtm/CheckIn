export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] px-6">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">📡</div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">You&apos;re offline</h1>
        <p className="text-sm text-slate-500">
          Check-In needs an internet connection. Reconnect and try again.
        </p>
      </div>
    </div>
  );
}
