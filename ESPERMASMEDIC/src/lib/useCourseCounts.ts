import { useEffect, useState } from 'react'
import { supabase } from './supabase'

// Devuelve { slug: total de preguntas }. Si Supabase no está configurado, queda vacío.
export function useCourseCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  useEffect(() => {
    if (!supabase) return
    supabase.rpc('course_question_counts').then(({ data }) => {
      if (data) setCounts(Object.fromEntries(data.map((r: { slug: string; total: number }) => [r.slug, Number(r.total)])))
    })
  }, [])
  return counts
}
