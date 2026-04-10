export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-primary)", padding: "80px 20px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", lineHeight: 1.6 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "2.5rem", marginBottom: 24 }}>Privacy Policy</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>Last updated: April 2026</p>
        <div style={{ color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 16 }}>
          <p>
            At LandingLens, we value your privacy. This policy explains what information we collect when you use our service, how we use it, and how we protect it.
          </p>
          <h2 style={{ color: "var(--text-primary)", marginTop: 24, fontSize: "1.5rem" }}>1. Information We Collect</h2>
          <p>
            We only collect information necessary to provide our service. This includes the URLs you submit for auditing and the time of the request.
          </p>
          <h2 style={{ color: "var(--text-primary)", marginTop: 24, fontSize: "1.5rem" }}>2. How We Use Information</h2>
          <p>
            We use the submitted URLs exclusively to capture a screenshot and perform the AI-driven CRO audit. The results are available to you immediately and we do not use your URLs to solicit you or sell to third parties.
          </p>
          <h2 style={{ color: "var(--text-primary)", marginTop: 24, fontSize: "1.5rem" }}>3. Analytics</h2>
          <p>
            We use anonymized website analytics to track page views and feature usage so we can continue improving the product. This data does not contain personally identifiable information.
          </p>
          <h2 style={{ color: "var(--text-primary)", marginTop: 24, fontSize: "1.5rem" }}>4. Contact Us</h2>
          <p>
            If you have any questions about this policy, please reach out to us at <a href="mailto:support@loxlite.com" style={{ color: "var(--text-primary)", textDecoration: "underline" }}>support@loxlite.com</a>.
          </p>
        </div>
        <div style={{ marginTop: 48 }}>
          <a href="/" style={{ color: "var(--text-primary)", textDecoration: "underline", fontSize: 14 }}>&larr; Back to home</a>
        </div>
      </div>
    </main>
  );
}
