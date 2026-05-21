import { Nav } from '../nav';
import { ScanForm } from './scan-form';

export const dynamic = 'force-dynamic';

export default function ScanPage() {
  return (
    <>
      <Nav active="scan" />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <section className="mk-fade">
          <h1 className="text-xl font-semibold tracking-tight">Locator scan</h1>
          <p className="mt-2 text-[14px] text-neutral-400 leading-relaxed">
            The builder side of MendKit. Point it at any page and it opens it in
            real Chromium, walks every interactive element, and drafts a
            resilient locator for each — the preferred selector plus the
            fallback signals healing would lean on. Drop these straight into a
            flow.
          </p>
        </section>
        <ScanForm />
      </main>
    </>
  );
}
