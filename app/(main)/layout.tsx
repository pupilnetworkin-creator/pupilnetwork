import AppNavbar from '@/components/layout/AppNavbar'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* 1. Base Background Layer */}
      <div className="fixed inset-0 bg-[#fdfdff] -z-30" />
      
      {/* 2. Glassy Decorations Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-400/30 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-purple-400/30 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-300/25 rounded-full blur-[100px]" />
        <div className="absolute bottom-[5%] left-[10%] w-[25%] h-[25%] bg-pink-300/25 rounded-full blur-[90px]" />
      </div>

      {/* 3. Content Layer */}
      <AppNavbar />
      <main className="flex-1 pt-24 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12 relative z-10">
        {children}
      </main>
    </div>
  )
}
