import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 py-16 text-center">
      <div className="max-w-3xl space-y-8">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Supercharge your study sessions with{' '}
          <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            PupilNetwork
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
          The ultimate platform for students. Join rooms, collaborate in real-time, ask questions, and climb the leaderboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link 
            href="/signup" 
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
          >
            Get Early Access
          </Link>
          <Link 
            href="/login" 
            className="w-full sm:w-auto px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-full border border-gray-700 transition-all"
          >
            Sign In
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 text-left">
          <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 shadow-xl">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-blue-400 text-xl font-bold">💬</span>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Live Study Rooms</h3>
            <p className="text-gray-400">Join real-time chat rooms with classmates to discuss assignments and study together.</p>
          </div>
          
          <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 shadow-xl">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-purple-400 text-xl font-bold">🎯</span>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Q&A Board</h3>
            <p className="text-gray-400">Post difficult questions, answer others, and earn points for your helpful contributions.</p>
          </div>
          
          <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 shadow-xl">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-green-400 text-xl font-bold">🤖</span>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">AI Study Buddy</h3>
            <p className="text-gray-400">Got stuck? Ask our AI assistant for quick explanations and concepts breakdown.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
