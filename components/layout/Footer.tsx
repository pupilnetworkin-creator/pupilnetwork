import Link from 'next/link'
import { GraduationCap, Code2, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                PupilNetwork
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              The student study collaboration platform built for India. Study smarter, together.
            </p>
            <div className="flex items-center gap-2 mt-4 text-gray-400 text-sm">
              <span>Built with</span>
              <Heart className="w-4 h-4 text-red-400 fill-red-400" />
              <span>by a first-year student</span>
              <span>🇮🇳</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wider">Product</h3>
            <ul className="space-y-3">
              {[
                { href: '/#features', label: 'Features' },
                { href: '/#pricing', label: 'Pricing' },
                { href: '/leaderboard', label: 'Leaderboard' },
                { href: '/premium', label: '⭐ Premium' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3">
              {[
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms', label: 'Terms of Service' },
                { href: 'mailto:support@pupilnetwork.is-a.dev', label: 'Contact' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-indigo-600 text-sm transition-colors flex items-center gap-1"
                >
                  <Code2 className="w-3.5 h-3.5" /> GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-xs">
            © {new Date().getFullYear()} PupilNetwork. All rights reserved.
          </p>
          <p className="text-gray-400 text-xs">
            Made in India 🇮🇳 · Free for students
          </p>
        </div>
      </div>
    </footer>
  )
}
