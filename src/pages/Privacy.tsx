import { Link } from "react-router";
import NovaSyncLogo from "../components/NovaSyncLogo";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "1. Introduction",
    content: `NovaSync ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our collaborative project management platform. By using NovaSync, you agree to the collection and use of information in accordance with this policy.`,
  },
  {
    title: "2. Information We Collect",
    content: `We collect information that you provide directly to us and information generated through your use of the platform.

Account Information: When you create an account, we collect your name, email address, and password (stored in encrypted form). You may optionally provide a profile image and bio.

Workspace Data: Information about workspaces you create or join, including workspace names and descriptions.

Project Data: Project names, descriptions, tasks, comments, timelines, and all associated content you create within projects.

Usage Data: We automatically collect certain information about how you interact with NovaSync, including pages visited, features used, and session duration.`,
  },
  {
    title: "3. How We Use Your Information",
    content: `We use the information we collect to:

Provide, maintain, and improve NovaSync's features and functionality.
Process transactions and send related information.
Send administrative notifications, including security and support alerts.
Provide AI-powered project insights and recommendations.
Communicate with you about updates, features, and promotional offers.
Ensure the security and integrity of our platform.
Comply with legal obligations and enforce our terms.`,
  },
  {
    title: "4. Data Storage and Security",
    content: `Your data is stored on secure cloud infrastructure provided by Convex. We implement industry-standard security measures including:

Encrypted data transmission (TLS/SSL)
Encrypted password storage
Authentication token management
Server-side access controls
Regular security monitoring

While we take reasonable precautions, no method of transmission or storage is 100% secure. We cannot guarantee absolute security.`,
  },
  {
    title: "5. Data Sharing",
    content: `We do not sell your personal information. We may share your data only in the following circumstances:

With team members within workspaces and projects you belong to, based on your configured permissions.
With third-party service providers who assist in operating NovaSync (hosting, analytics), bound by confidentiality agreements.
When required by law, regulation, or valid legal process.
To protect the rights, property, or safety of NovaSync, our users, or the public.`,
  },
  {
    title: "6. User Rights",
    content: `You have the right to:

Access the personal information we hold about you.
Correct inaccurate or incomplete personal data.
Delete your account and associated personal data.
Export your project and workspace data.
Opt out of non-essential communications.
Restrict certain processing of your personal data.

To exercise these rights, contact us at privacy@novasync.app.`,
  },
  {
    title: "7. Data Retention",
    content: `We retain your personal information for as long as your account is active or as needed to provide you services. If you delete your account, we will remove your personal data within 30 days, except where we need to retain certain information for legal or legitimate business purposes.

Workspace and project data shared with other team members may persist in their accounts even after your deletion.`,
  },
  {
    title: "8. Cookies and Local Storage",
    content: `NovaSync uses essential cookies and local storage to:

Maintain your authentication session.
Store your workspace preferences and settings.
Remember your UI preferences.

We do not use third-party advertising cookies. You can manage cookie preferences through your browser settings.`,
  },
  {
    title: "9. Third-Party Services",
    content: `NovaSync may integrate with third-party services for specific features. These services have their own privacy policies. We encourage you to review the privacy policies of any third-party services you interact with through NovaSync.

We use Convex for backend infrastructure and authentication. Their privacy policy governs their handling of data processed through their platform.`,
  },
  {
    title: "10. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. Your continued use of NovaSync after changes constitutes acceptance of the revised policy.`,
  },
  {
    title: "11. Contact Us",
    content: `If you have questions about this Privacy Policy, please contact us at privacy@novasync.app.`,
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--nova-surface-warm)' }}>
      <nav
        className="sticky top-0 z-50 w-full"
        style={{
          background: 'rgba(250,249,247,0.85)',
          backdropFilter: "blur(16px)",
          borderBottom: '1px solid var(--nova-border)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <NovaSyncLogo size={26} />
            <span className="text-base font-bold" style={{ color: 'var(--nova-text)' }}>
              NovaSync
            </span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: 'var(--nova-text-muted)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="animate-fade-in">
          <h1
            className="text-3xl sm:text-4xl font-extrabold mb-3"
            style={{ color: 'var(--nova-text)' }}
          >
            Privacy Policy
          </h1>
          <p className="text-sm mb-10" style={{ color: 'var(--nova-text-muted)' }}>
            Last updated: August 2026
          </p>

          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2
                  className="text-lg font-bold mb-3"
                  style={{ color: 'var(--nova-text)' }}
                >
                  {section.title}
                </h2>
                <div
                  className="text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: 'var(--nova-text-secondary)' }}
                >
                  {section.content}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>

      <footer
        className="py-8 px-4"
        style={{ borderTop: '1px solid var(--nova-border)', background: 'var(--nova-surface)' }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NovaSyncLogo size={18} />
            <span className="text-xs font-semibold" style={{ color: 'var(--nova-text)' }}>
              NovaSync
            </span>
          </div>
          <Link
            to="/"
            className="text-xs transition-colors"
            style={{ color: 'var(--nova-text-muted)' }}
          >
            Return home
          </Link>
        </div>
      </footer>
    </div>
  );
}
