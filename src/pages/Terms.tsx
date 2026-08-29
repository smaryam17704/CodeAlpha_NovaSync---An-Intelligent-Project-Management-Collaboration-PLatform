import { Link } from "react-router";
import NovaSyncLogo from "../components/NovaSyncLogo";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "1. Introduction",
    content: `Welcome to NovaSync. These Terms of Service ("Terms") govern your access to and use of the NovaSync platform, including its features, tools, and services. By accessing or using NovaSync, you agree to be bound by these Terms. If you do not agree, do not use the platform.`,
  },
  {
    title: "2. Use of NovaSync",
    content: `NovaSync is a collaborative project management platform designed for teams to plan, manage, and track projects. You may use NovaSync only for lawful purposes and in accordance with these Terms.

You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.`,
  },
  {
    title: "3. User Accounts",
    content: `To use NovaSync, you must create an account. You agree to:

Provide accurate, current, and complete information during registration.
Maintain and promptly update your account information.
Keep your password secure and confidential.
Notify us immediately of any unauthorized use of your account.

You may not share your account credentials or create multiple accounts for the same person.`,
  },
  {
    title: "4. Workspace and Project Usage",
    content: `Workspaces and projects are collaborative environments. By creating or joining a workspace, you acknowledge that:

Other workspace members can see content shared within the workspace.
Workspace owners and admins can manage member access and permissions.
Project data may be visible to team members based on their assigned roles.
You are responsible for the content you create and share within workspaces.`,
  },
  {
    title: "5. User Responsibilities",
    content: `You agree not to:

Use NovaSync for any unlawful or fraudulent purpose.
Attempt to gain unauthorized access to other accounts or system infrastructure.
Interfere with or disrupt the platform's operation.
Upload malicious code, viruses, or harmful content.
Misuse AI features to generate harmful, misleading, or prohibited content.
Violate the intellectual property rights of others.`,
  },
  {
    title: "6. Intellectual Property",
    content: `NovaSync and its original content, features, and functionality are owned by NovaSync and are protected by copyright, trademark, and other intellectual property laws.

You retain ownership of all content you create within NovaSync. By creating content, you grant NovaSync a limited license to store, process, and display that content as necessary to provide the service.`,
  },
  {
    title: "7. Project Data",
    content: `All project data, including tasks, comments, files, and other content, belongs to the user or organization that created it. NovaSync does not claim ownership of your project data.

You are responsible for backing up important project data. While we maintain reliable infrastructure, we recommend maintaining independent backups for critical information.`,
  },
  {
    title: "8. Service Availability",
    content: `We strive to maintain high availability of NovaSync but do not guarantee uninterrupted access. The platform may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.

We reserve the right to modify, suspend, or discontinue any part of the service at any time with reasonable notice.`,
  },
  {
    title: "9. Limitation of Liability",
    content: `To the maximum extent permitted by law, NovaSync shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform.

Our total liability for any claims related to NovaSync shall not exceed the amount you paid us in the twelve (12) months preceding the claim, or $100, whichever is greater.`,
  },
  {
    title: "10. Changes to Terms",
    content: `We reserve the right to modify these Terms at any time. We will notify you of material changes through the platform or via email. Continued use of NovaSync after changes take effect constitutes acceptance of the revised Terms.`,
  },
  {
    title: "11. Contact Us",
    content: `If you have questions about these Terms, please contact us at legal@novasync.app.`,
  },
];

export default function Terms() {
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
            Terms of Service
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
