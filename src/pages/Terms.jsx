import { Link } from "react-router-dom";
import { PageFade } from "../components/ui";

const LAST_UPDATED = "October 18, 2026";

export default function Terms() {
  return (
    <PageFade>
      <article className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Legal</p>
        <h1 className="display !text-4xl text-[#0B2A6B] dark:text-white">Terms of Service</h1>
        <p className="mt-2 text-[13px] text-slate-500 dark:text-slate-300">Last updated: {LAST_UPDATED}</p>

        <div className="mt-6 space-y-6 text-[14px] leading-relaxed text-slate-700 dark:text-slate-200">
          <section>
            <h2 className="text-lg font-bold text-[#0B2A6B] dark:text-white">1. Acceptance of these terms</h2>
            <p className="mt-2">
              By signing in or using the Kilala Dormitory web application, you agree to be bound by these Terms of
              Service. If you do not agree, do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B2A6B] dark:text-white">2. Eligibility</h2>
            <p className="mt-2">
              The service is for students and applicants of Bukidnon State University seeking dormitory housing. You must
              provide accurate, current, and complete information and keep it updated.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B2A6B] dark:text-white">3. Your account</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>You are responsible for keeping your sign-in credentials (your BukSU Google account or dorm-office password) secure and for all activity under your account.</li>
              <li>One person, one account. Do not share credentials or impersonate others.</li>
              <li>Notify the Housing Office promptly if you suspect unauthorized access.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B2A6B] dark:text-white">4. Acceptable use</h2>
            <p className="mt-2">You agree not to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Use the service for any unlawful, fraudulent, or harmful purpose</li>
              <li>Attempt to access, alter, or delete data belonging to other users</li>
              <li>Probe, scan, or test the security of the service, or bypass row-level security or authentication</li>
              <li>Upload malware, illegal content, or content that infringes others&rsquo; rights</li>
              <li>Spam, harass, or abuse other users or staff</li>
              <li>Scrape or automate access in a way that disrupts the service</li>
              <li>Impersonate another person or misrepresent your identity or enrollment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B2A6B] dark:text-white">5. Applications and documents</h2>
            <p className="mt-2">
              You certify that the information and documents you submit are true, complete, and yours to submit. The Housing
              Office may verify them and may reject or terminate an application found to be false, incomplete, or fraudulent.
              Submitted documents are stored and processed for housing administration.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B2A6B] dark:text-white">6. Rates and billing</h2>
            <p className="mt-2">
              The monthly rate shown in the app is computed from a base rate plus a charge per registered appliance. Rates
              are set by the Housing Office and may change with notice. The app provides an estimate for planning; actual
              charges and payment terms are governed by university housing policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B2A6B] dark:text-white">7. Intellectual property</h2>
            <p className="mt-2">
              The application, its code, design, brand, and logos belong to Bukidnon State University / the Housing Office.
              You retain ownership of the content you submit, but grant us a non-exclusive license to store, process, and use
              it for housing administration. You may not copy, modify, reverse-engineer, or redistribute the service except
              as permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B2A6B] dark:text-white">8. Privacy</h2>
            <p className="mt-2">
              Your use of the service is also governed by our{" "}
              <Link to="/privacy" className="font-semibold text-[#0B2A6B] underline dark:text-[#FFD120]">Privacy Policy</Link>,
              which explains how we handle personal data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B2A6B] dark:text-white">9. Third-party services</h2>
            <p className="mt-2">
              The service relies on third parties such as Supabase (hosting, database, authentication, storage) and Google
              (Workspace sign-in and Gemini for the Dormi assistant). Your use of those services is subject to their own terms and privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B2A6B] dark:text-white">10. Termination</h2>
            <p className="mt-2">
              We may suspend or terminate your account or access at any time if you violate these terms or for operational
              or legal reasons. You may stop using the service at any time. On termination, data is handled according to
              our Privacy Policy and retention rules.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B2A6B] dark:text-white">11. Disclaimer of warranties</h2>
            <p className="mt-2">
              The service is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties of any kind,
              express or implied. We do not guarantee that it will be uninterrupted, error-free, or completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B2A6B] dark:text-white">12. Limitation of liability</h2>
            <p className="mt-2">
              To the maximum extent permitted by law, we are not liable for any indirect, incidental, special,
              consequential, or punitive damages, or for loss of data or profits, arising from your use of or inability to
              use the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B2A6B] dark:text-white">13. Indemnification</h2>
            <p className="mt-2">
              You agree to indemnify and hold harmless Bukidnon State University and the Housing Office from claims arising
              from your misuse of the service, your violation of these terms, or false or misleading information you submit.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B2A6B] dark:text-white">14. Changes to these terms</h2>
            <p className="mt-2">
              We may modify these Terms of Service at any time. The &ldquo;Last updated&rdquo; date reflects the latest
              version. Continued use of the service after changes means you accept the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B2A6B] dark:text-white">15. Governing law</h2>
            <p className="mt-2">
              These terms are governed by the laws of the Republic of the Philippines. Disputes shall be brought before the
              competent courts in Bukidnon, Philippines.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B2A6B] dark:text-white">16. Contact</h2>
            <p className="mt-2">
              Housing Office, Bukidnon State University. Use the contact details provided in your admission documents for
              legal or account matters.
            </p>
          </section>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-4 text-[12px] text-slate-400 dark:border-white/10">
          See also our <Link to="/privacy" className="underline">Privacy Policy</Link> and{" "}
          <Link to="/storage-policy" className="underline">Cookie Policy</Link>.
        </div>
      </article>
    </PageFade>
  );
}