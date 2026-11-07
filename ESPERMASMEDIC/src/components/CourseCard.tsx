import type { Course } from '../data/courses'

export default function CourseCard({ course, count }: { course: Course; count?: number }) {
  const { slug, name, icon: Icon, description } = course
  return (
    <a id={slug} href={`#${slug}`}
      className="group flex flex-col rounded-2xl border border-celeste-300 bg-white p-5 transition hover:-translate-y-0.5 hover:border-navy-700 hover:shadow-lg hover:shadow-navy-900/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy-700">
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-celeste-200 text-navy-800 transition group-hover:bg-navy-900 group-hover:text-celeste-300">
        <Icon size={22} />
      </span>
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-1 flex-1 text-sm text-navy-700/80">{description}</p>
      <p className="mt-4 text-sm font-medium text-navy-700">{count ? `${count} ${count === 1 ? 'pregunta' : 'preguntas'}` : 'Sin preguntas todavía'}</p>
    </a>
  )
}
