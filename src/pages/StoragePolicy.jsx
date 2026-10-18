import { Link } from "react-router-dom";
import { PageFade } from "../components/ui";

const LAST_UPDATED = "October 18, 2026";

export default function CookiePolicy() {
  return (
    <PageFade>
      <article className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Legal</p>
        <h1 className="display !text-4xl text-[#0A1F44] dark:text-white">Cookie Policy</h1>
        <p className="mt-2 text-[13px] text-slate-500 dark:text-slate-300">Last updated: {LAST_UPDATED}</p>

        <div className="mt-6 space-y-6 text-[14px] leading-relaxed text-slate-700 dark:text-slate-200">
          <section>
            <h2 className="text-lg font-bold text-[#0A1F44] dark:text-white">1. What this policy covers</h2>
            <p className="mt-2">
              This Cookie Policy explains how Kilala Dormitory uses cookies and similar technologies (such as localStorage
              and IndexedDB) in your browser. It should be read together with our{" "}
              <Link to="/privacy" className="font-semibold text-[#0A1F44] underline dark:text-[#FFC72C]">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0A1F44] dark:text-white">2. What we use (essential storage only)</h2>
            <p className="mt-2">We use browser storage that is strictly necessary to run the app:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Authentication session</strong> (localStorage) — keeps you signed in between visits.</li>
              <li><strong>Theme preference</strong> (localStorage) — remembers light/dark mode.</li>
              <li><strong>Application draft</strong> (localStorage + IndexedDB) — saves your in-progress application (text and uploaded files) on this device so you can resume after a reload.</li>
              <li><strong>Cookie consent choice</strong> (localStorage) — remembers that you have seen and responded to the consent banner.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0A1F44] dark:text-white">3. What we do not use</h2>
            <p className="mt-2">
              We do not use analytics, advertising, or third-party tracking cookies. We do not use Google Analytics or any
              similar tracking tool, and we do not profile you across sites.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0A1F44] dark:text-white">4. Third parties</h2>
            <p className="mt-2">
              Our authentication provider (Supabase) may process technical data needed to secure sessions. The Dormi
              assistant uses Google Gemini only when you choose to chat with it, and only with the limited context described
              in the Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0A1F44] dark:text-white">5. Consent</h2>
            <p className="mt-2">
              On your first visit we show a consent banner. Because we use only essential storage, both &ldquo;Accept
              all&rdquo; and &ldquo;Essential only&rdquo; keep the app working; the latter simply confirms that no optional
              trackers are enabled. You can review this policy at any time via the footer link.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0A1F44] dark:text-white">6. Managing or clearing storage</h2>
            <p className="mt-2">
              You can clear site data through your browser settings. Clearing storage will sign you out, reset your theme to
              the default, and delete any saved application draft and uploaded draft files. The app will continue to work, but
              you may need to sign in again.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0A1F44] dark:text-white">7. Changes to this policy</h2>
            <p className="mt-2">
              We may update this Cookie Policy from time to time. The &ldquo;Last updated&rdquo; date reflects the latest
              version.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0A1F44] dark:text-white">8. Contact</h2>
            <p className="mt-2">
              Housing Office, Bukidnon State University. Use the contact details provided in your admission documents for
              privacy or data requests.
            </p>
          </section>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-4 text-[12px] text-slate-400 dark:border-white/10">
          See also our <Link to="/privacy" className="underline">Privacy Policy</Link> and{" "}
          <Link to="/terms" className="underline">Terms of Service</Link>.
        </div>
      </article>
    </PageFade>
  );
}