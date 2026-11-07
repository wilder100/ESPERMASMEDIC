import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useSession } from './useSession'

export interface TreeTopic { id: string; name: string }
export interface TreeUnit { id: string; name: string; sort_order: number; topics: TreeTopic[] }
export interface TreeCourse { id: string; slug: string; name: string; area: 'basicas' | 'clinicas'; sort_order: number; units: TreeUnit[] }

// El rol solo sirve para mostrar u ocultar la interfaz; la seguridad real la imponen las políticas RLS.
export function useProfile() {
  const { session, loading } = useSession()
  const [role, setRole] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (loading) return
    if (!supabase || !session) { setRole(null); setReady(true); return }
    supabase.from('profiles').select('role').eq('id', session.user.id).single()
      .then(({ data }) => { setRole(data?.role ?? null); setReady(true) })
  }, [session, loading])
  return { session, role, ready }
}

export function useTree() {
  const [tree, setTree] = useState<TreeCourse[]>([])
  const reload = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from('courses')
      .select('id,slug,name,area,sort_order,units(id,name,sort_order,topics(id,name))').order('sort_order')
    const t = ((data ?? []) as unknown as TreeCourse[]).map((c) => ({
      ...c, units: [...c.units].sort((a, b) => a.sort_order - b.sort_order),
    }))
    setTree(t)
  }, [])
  useEffect(() => { reload() }, [reload])
  return { tree, reload }
}
