import AppNavbar from '@/components/layout/AppNavbar'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppNavbar />
      <main className="flex-1 pt-16 mt-0.5 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12">
        {children}
      </main>
    </div>
  )
}
