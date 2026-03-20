'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthGuard({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        if (pathname !== '/login') {
          router.push('/login')
        }
        setLoading(false)
        return
      }

      if (adminOnly) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single()

        const adminEmails = ['fixar.tec@hotmail.com', 'jhefesonn@hotmail.com']
        const isAdmin = profile?.is_admin || adminEmails.includes(session.user.email || '')

        if (!isAdmin) {
          router.push('/client')
          setLoading(false)
          return
        }
      }

      setAuthenticated(true)
      setLoading(false)
    }

    checkAuth()
  }, [router, pathname, adminOnly])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent"></div>
      </div>
    )
  }

  if (!authenticated && pathname !== '/login') return null

  return <>{children}</>
}
