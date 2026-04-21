'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Ban, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function RevokeButton({ codeId, secret }: { codeId: string; secret: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRevoke = async () => {
    if (!window.confirm("Are you sure you want to revoke this code? It will strip premium from the user who claimed it.")) return

    setLoading(true)
    try {
      const res = await fetch('/api/premium/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codeId, adminSecret: secret }),
      })

      if (!res.ok) {
        toast.error('Failed to revoke code.')
      } else {
        toast.success('Code revoked successfully.')
        router.refresh()
      }
    } catch {
      toast.error('Network error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleRevoke}
      disabled={loading}
      className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 h-8"
      title="Revoke Code"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
    </Button>
  )
}
