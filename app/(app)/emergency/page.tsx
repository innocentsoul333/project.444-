import { Button } from "@/components/ui/Button";

export default function EmergencyPage() {
  return (
    <main className="space-y-4">
      <header className="glass-card">
        <h2 className="page-title">Emergency Reporting</h2>
        <p className="page-subtitle mt-2">
          Anonymous reporting for safety, harassment, and urgent incidents.
        </p>
      </header>
      <section className="glass-card">
        <h3 className="font-semibold">Quick Actions</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="destructive">Report Incident</Button>
          <Button variant="outline">Share Location</Button>
          <Button variant="secondary">Campus Helpline</Button>
        </div>
      </section>
    </main>
  );
}
