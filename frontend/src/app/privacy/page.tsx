import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy | TANGLAW",
  description: "How TANGLAW handles account and chat information.",
};

export default function PrivacyPage() {
  return (
    <article className="relative z-10 mx-auto w-full max-w-3xl px-6 pb-24 pt-32 text-[color:var(--theme-text-body)]">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-[color:var(--theme-typography-secondary)]">
        TANGLAW Research Project
      </p>
      <h1 className="mt-4 text-4xl font-black text-[color:var(--theme-typography-main)]">Privacy</h1>
      <p className="mt-4 text-sm">Updated September 30, 2026</p>

      <div className="mt-10 space-y-8 leading-7">
        <section>
          <h2 className="text-xl font-bold text-[color:var(--theme-typography-main)]">Account information</h2>
          <p className="mt-2">
            When you sign in with Google or Microsoft, TANGLAW receives your name, email address,
            and an account identifier from that provider. We use this information to create or find
            your TANGLAW account. We do not request access to your email inbox or files. If you
            create an account with an email address and password, we store a password hash instead
            of your password.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[color:var(--theme-typography-main)]">Chat and session data</h2>
          <p className="mt-2">
            TANGLAW stores your Owel chat messages with your account. When you ask Owel a question,
            the question and conversation context are sent to Google Gemini or, if that service is
            unavailable, an OpenRouter model to produce an answer. TANGLAW uses browser storage for
            an access token and a daily chat usage count. The sign-in service also uses session
            cookies to keep you signed in.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[color:var(--theme-typography-main)]">Service providers and retention</h2>
          <p className="mt-2">
            TANGLAW runs on Vercel and Render and stores account and chat records in Supabase.
            Account and chat records remain until the project team removes them; this version has
            no automatic deletion schedule or self-service account deletion tool.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[color:var(--theme-typography-main)]">Contact</h2>
          <p className="mt-2">
            For questions about your data or a deletion request, email{" "}
            <a className="underline underline-offset-4" href="mailto:tanglaw-support@googlegroups.com">
              tanglaw-support@googlegroups.com
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
