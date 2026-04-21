export const metadata = {
  title: 'Privacy Policy — PupilNetwork',
  description: 'How PupilNetwork handles your personal data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-4xl mx-auto py-24 px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 prose prose-slate max-w-none">
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Privacy Policy</h1>
          <p className="lead">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          
          <p>
            Welcome to PupilNetwork. We are committed to protecting your personal information and your right to privacy. 
            Because this platform is built by a student for students, we collect the bare minimum required to make the app function.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            We collect personal information that you voluntarily provide to us when you register on the Services.
            This includes your name, email address, passwords, and username. We also store chat messages in public rooms and Q&A posts.
          </p>

          <h2>2. How We Use Your Information</h2>
          <p>
            We use personal information collected via our Services for a variety of business purposes described below:
          </p>
          <ul>
            <li><strong>To facilitate account creation and logon process.</strong></li>
            <li><strong>To manage user accounts.</strong> We may use your information for the purposes of managing our account and keeping it in working order.</li>
            <li><strong>To provide AI assistance.</strong> Your questions sent to the AI Study Buddy are processed by Google's Gemini API. We save conversation history to allow the AI to maintain context.</li>
          </ul>

          <h2>3. Video Calls (Jitsi Meet)</h2>
          <p>
            Our video calling functionality is powered by Jitsi Meet. Jitsi is fully encrypted and we do not record, store, or have access to any video/audio streams on PupilNetwork servers.
          </p>

          <h2>4. Payments</h2>
          <p>
            Payments for the Premium tier are handled via direct UPI transfer. We do not store any banking details or payment instruments. We only store transaction reference (UTR) numbers to verify payments.
          </p>

          <h2>Contact Us</h2>
          <p>If you have questions or comments about this notice, you may email us at <a href="mailto:privacy@pupilnetwork.is-a.dev">privacy@pupilnetwork.is-a.dev</a>.</p>
        </div>
      </main>
    </div>
  )
}
