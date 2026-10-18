import { Link } from "react-router-dom";
import { PageFade } from "../components/ui";

const LAST_UPDATED = "October 18, 2026";

export default function Privacy() {
  return (
    <PageFade>
      <article className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Legal</p>
        <h1 className="display !text-4xl text-[#0A1F44] dark:text-white">Privacy Policy</h1>
        <p className="mt-2 text-[13px] text-slate-500 dark:text-slate-300">Last updated: {LAST_UPDATED}</p>

        <div className="mt-6 space-y-6 text-[14px] leading-relaxed text-slate-700 dark:text-slate-200">
          <section>
            <h2 className="text-lg font-bold text-[#0A1F44] dark:text-white">1. Who we are</h2>
            <p className="mt-2">
              Kilala Dormitory is operated by the Housing Office of Bukidnon State University (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
              &ldquo;our&rdquo;). This Privacy Policy explains how we collect, use, store, and share personal data when you use
              the Kilala Dormitory web application. We are committed to protecting your privacy under the Data Privacy Act of
              2012 (Republic Act 10173) and other applicable data-protection laws, including, where applicable, the GDPR and
              CCPA.
            </p>
            <p className="mt-2">
              Questions about this policy or your data? Contact the Housing Office (use the email or office contact details
              provided in your admission documents).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0A1F44] dark:text-white">2. Data we collect</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Account data:</strong> full name, email address, and a password stored only as a salted hash by our authentication provider (Supabase Auth). Profile role (student or admin).</li>
              <li><strong>Application data:</strong> student ID, course, year level, contact number, parent/guardian name and contact number, home address, selected term, and your list of devices/appliances.</li>
              <li><strong>Documents:</strong> files you upload (signed forms and supporting documents such as certificates and medical results).</li>
              <li><strong>Computed data:</strong> your monthly rate, derived from the base rate plus registered appliances.</li>
              <li><strong>Technical data:</strong> IP address, browser and device information, timestamps, and authentication/security events processed by our hosting and database provider.</li>
              <li><strong>Assistant data:</strong> when you use the Dormi assistant, a limited context (application status, course, year, device names, missing documents) and your chat messages.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0A1F44] dark:text-white">3. How we use your data</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Process, review, and decide on dormitory applications</li>
              <li>Communicate application status and remarks to you</li>
              <li>Compute and display your monthly rate</li>
              <li>Verify uploaded documents</li>
              <li>Administer accounts and protect the service (security, fraud prevention)</li>
              <li>Improve the application experience</li>
              <li>Comply with university records and legal obligations</li>
            </ul>
            <p className="mt-2">We do not sell your personal data and do not use it for advertising.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0A1F44] dark:text-white">4. Legal basis</h2>
            <p className="mt-2">
              We process your data on the basis of your consent (creating an account and submitting an application),
              our legitimate interests (security, service improvement, university administration), and legal obligations
              (university record-keeping and applicable law).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0A1F44] dark:text-white">5. Sharing and third parties</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Supabase</strong> (database, authentication, file storage, edge functions) acts as our data processor and hosts the data in its cloud infrastructure.</li>
              <li><strong>Housing Office staff / administrators</strong> with role-based access review applications and documents.</li>
              <li><strong>Dormi assistant</strong> sends only the limited context described in section 2 to Google Gemini to answer your questions. It never sends student IDs, phone numbers, guardian details, home addresses, or document contents.</li>
              <li><strong>Legal / regulatory</strong> disclosures when required by law or to protect rights and safety.</li>
            </ul>
            <p className="mt-2">We do not share your data with advertisers or data brokers.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0A1F44] dark:text-white">6. Storage and security</h2>
            <p className="mt-2">
              Data is stored in Supabase&rsquo;s cloud database and storage, protected by row-level security policies so users
              can only access their own records. Connections use HTTPS. Authentication tokens are kept in your browser&rsquo;s
              storage. We apply reasonable technical and organizational measures, but no system is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0A1F44] dark:text-white">7. Retention</h2>
            <p className="mt-2">
              We retain your account and application data while your account is active and as needed for housing
              administration, audit, and legal obligations. Uploaded documents are retained for the application cycle and
              any required record-keeping period. You may request deletion (see section 8); some data may be retained where
              required by law or university policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0A1F44] dark:text-white">8. Your rights</h2>
            <p className="mt-2">Subject to applicable law, you may request to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Delete your data</li>
              <li>Object to or restrict processing</li>
              <li>Receive a copy of your data (portability)</li>
              <li>Withdraw consent (where processing is based on consent)</li>
            </ul>
            <p className="mt-2">
              Contact the Housing Office to exercise these rights. Please note that deleting your data may affect your
              application or housing records.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0A1F44] dark:text-white">9. Cookies and similar technologies</h2>
            <p className="mt-2">
              We use browser storage (localStorage and IndexedDB) for essential functions such as keeping you signed in,
              remembering your theme, saving your application draft, and recording your cookie choice. We do not use
              analytics, advertising, or third-party tracking cookies. See our{" "}
              <Link to="/storage-policy" className="font-semibold text-[#0A1F44] underline dark:text-[#FFC72C]">Cookie Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0A1F44] dark:text-white">10. Minors</h2>
            <p className="mt-2">
              The service is intended for enrolled university students. If you are under 18, please use the service with
              the involvement of a parent or guardian.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0A1F44] dark:text-white">11. Changes to this policy</h2>
            <p className="mt-2">
              We may update this Privacy Policy from time to time. The &ldquo;Last updated&rdquo; date reflects the latest
              version. Continued use of the service after changes means you accept the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0A1F44] dark:text-white">12. Contact</h2>
            <p className="mt-2">
              Housing Office, Bukidnon State University. Use the contact details provided in your admission documents for
              privacy or data requests.
            </p>
          </section>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-4 text-[12px] text-slate-400 dark:border-white/10">
          See also our <Link to="/terms" className="underline">Terms of Service</Link> and{" "}
          <Link to="/storage-policy" className="underline">Cookie Policy</Link>.
        </div>
      </article>
    </PageFade>
  );
}