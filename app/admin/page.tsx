import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Users, Mail, CreditCard, Ban } from 'lucide-react'

// Simple client wrapper for the Revoke button actions
import { RevokeButton } from './RevokeButton'

export default async function AdminPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  const secret = searchParams.secret
  
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <ShieldCheck className="w-16 h-16 text-slate-300 mx-auto" />
          <h1 className="text-2xl font-bold text-slate-900">404 Not Found</h1>
        </div>
      </div>
    )
  }

  const supabase = createAdminClient()

  // 1. Fetch Stats
  const [{ count: totalUsers }, { count: totalCodes }, { count: activeCodes }, { count: revokedCodes }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('premium_codes').select('*', { count: 'exact', head: true }),
    supabase.from('premium_codes').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('premium_codes').select('*', { count: 'exact', head: true }).eq('status', 'revoked')
  ])

  // 2. Fetch all codes for table
  const { data: codes } = await supabase
    .from('premium_codes')
    .select(`
      *,
      used_by_profile:profiles!premium_codes_used_by_fkey(display_name, email)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white rounded-2xl p-6 shadow-lg">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 mb-1">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-bold tracking-widest uppercase">Admin Panel</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              PupilNetwork Management
            </h1>
          </div>
          <Link href="/dashboard">
             <Button variant="outline" className="bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700">
               Return to App
             </Button>
          </Link>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <Card className="border-none shadow-sm">
             <CardContent className="p-6">
               <div className="flex items-center gap-3 text-slate-500 mb-2 font-medium">
                 <Users className="w-5 h-5 text-blue-500" /> Total Users
               </div>
               <div className="text-3xl font-bold text-slate-900">{totalUsers || 0}</div>
             </CardContent>
           </Card>
           <Card className="border-none shadow-sm">
             <CardContent className="p-6">
               <div className="flex items-center gap-3 text-slate-500 mb-2 font-medium">
                 <Mail className="w-5 h-5 text-indigo-500" /> Total Codes
               </div>
               <div className="text-3xl font-bold text-slate-900">{totalCodes || 0}</div>
             </CardContent>
           </Card>
           <Card className="border-none shadow-sm">
             <CardContent className="p-6">
               <div className="flex items-center gap-3 text-slate-500 mb-2 font-medium">
                 <ShieldCheck className="w-5 h-5 text-green-500" /> Active
               </div>
               <div className="text-3xl font-bold text-slate-900">{activeCodes || 0}</div>
             </CardContent>
           </Card>
           <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-white">
             <CardContent className="p-6">
               <div className="flex items-center gap-3 text-slate-500 mb-2 font-medium">
                 <CreditCard className="w-5 h-5 text-indigo-600" /> Est. Revenue
               </div>
               <div className="text-3xl font-bold text-indigo-900">₹{(totalCodes || 0) * 99}</div>
             </CardContent>
           </Card>
        </div>

        {/* Database Table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100 pb-4">
            <CardTitle>Premium Codes Database</CardTitle>
            <CardDescription>View, monitor, and revoke generated premium codes.</CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left line-height-relaxed">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Code</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Issued To</th>
                  <th className="px-6 py-4 font-semibold">UTR Number</th>
                  <th className="px-6 py-4 font-semibold">Used By</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {codes?.map((row) => (
                  <tr key={row.id} className={`bg-white hover:bg-slate-50/80 transition-colors ${row.status === 'revoked' ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">
                      {row.code}
                    </td>
                    <td className="px-6 py-4">
                      {row.status === 'active' && <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">Active</Badge>}
                      {row.status === 'used' && <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-none">Used</Badge>}
                      {row.status === 'revoked' && <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none">Revoked</Badge>}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      {row.email}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500">
                      {row.utr_number}
                    </td>
                    <td className="px-6 py-4">
                      {row.used_by_profile ? (
                        <div className="flex flex-col">
                           <span className="font-medium text-slate-700">{row.used_by_profile.display_name}</span>
                           <span className="text-xs text-slate-400">
                             {new Date(row.used_at).toLocaleDateString()}
                           </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unclaimed</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       {row.status !== 'revoked' && (
                         <RevokeButton codeId={row.id} secret={secret} />
                       )}
                    </td>
                  </tr>
                 ))}
                 {codes?.length === 0 && (
                   <tr>
                     <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                       No codes generated yet.
                     </td>
                   </tr>
                 )}
              </tbody>
            </table>
          </div>
        </Card>
        
      </div>
    </div>
  )
}
