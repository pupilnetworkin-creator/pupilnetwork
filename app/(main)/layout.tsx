import AppNavbar from '@/components/layout/AppNavbar'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      {/* Background Glassy Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/60 rounded-full blur-[140px] dark:bg-indigo-500/20" />
        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-purple-200/60 rounded-full blur-[120px] dark:bg-purple-500/20" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-100/50 rounded-full blur-[100px] dark:bg-blue-500/10" />
        <div className="absolute bottom-[5%] left-[10%] w-[25%] h-[25%] bg-pink-100/40 rounded-full blur-[90px] dark:bg-pink-500/10" />
      </div>

      <AppNavbar />
      <main className="flex-1 pt-24 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12 relative z-10">
        {children}
      </main>
    </div>
  )
}
