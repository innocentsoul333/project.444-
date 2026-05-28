import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SettingsPage() {
  return (
    <main className="space-y-4">
      <header className="glass-card">
        <h2 className="page-title">Settings</h2>
        <p className="page-subtitle mt-2">
          Privacy, location controls, notification preferences, and moderation options.
        </p>
      </header>
      <section className="glass-card space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-zinc-100">Display Name</label>
          <Input placeholder="Your display name" />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-zinc-100">Campus / Community</label>
          <Input placeholder="e.g. BITS Pilani" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button>Save Changes</Button>
          <Button variant="outline">Privacy Controls</Button>
        </div>
      </section>
    </main>
  );
}
