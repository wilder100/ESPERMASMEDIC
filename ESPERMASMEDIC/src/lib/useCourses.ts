import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { supabase } from './supabase'
import { courses as staticCourses, type Course } from '../data/courses'

// Cursos desde la base de datos (los crea el admin); usa los íconos del archivo local si coinciden.
export function useCourses(): Course[] {
  const [list, setList] = useState<Course[]>(staticCourses)
  useEffect(() => {
    if (!supabase) return
    const load = () => supabase!.from('courses').select('slug,name,area,sort_order').order('sort_order').then(({ data }) => {
      if (!data || data.length === 0) return
      setList(data.map((d) => {
        const s = staticCourses.find((c) => c.slug === d.slug)
        return { slug: d.slug, name: d.name, area: d.area, icon: s?.icon ?? BookOpen, description: s?.description ?? '' }
      }))
    })
    load()
    window.addEventListener('courses-changed', load)
    return () => window.removeEventListener('courses-changed', load)
  }, [])
  return list
}
