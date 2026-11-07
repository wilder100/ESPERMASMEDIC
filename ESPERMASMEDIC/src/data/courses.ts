import {
  Bone, Activity, FlaskConical, Microscope, Sprout, Bug, Droplets, Pill,
  ClipboardList, Stethoscope, HeartPulse, Scissors, Baby, Heart, type LucideIcon,
} from 'lucide-react'

export type Area = 'basicas' | 'clinicas'

export interface Course {
  slug: string
  name: string
  area: Area
  icon: LucideIcon
  description: string
}

// Temporal: en la etapa 2 estos datos vendrán de la tabla `courses` en Supabase.
export const courses: Course[] = [
  { slug: 'anatomia', name: 'Anatomía', area: 'basicas', icon: Bone, description: 'Estructuras del cuerpo humano, por regiones y sistemas.' },
  { slug: 'fisiologia', name: 'Fisiología', area: 'basicas', icon: Activity, description: 'Funcionamiento de órganos y sistemas.' },
  { slug: 'bioquimica', name: 'Bioquímica', area: 'basicas', icon: FlaskConical, description: 'Metabolismo y moléculas de la vida.' },
  { slug: 'histologia', name: 'Histología', area: 'basicas', icon: Microscope, description: 'Tejidos y su organización microscópica.' },
  { slug: 'embriologia', name: 'Embriología', area: 'basicas', icon: Sprout, description: 'Desarrollo desde la fecundación hasta el feto.' },
  { slug: 'microbiologia', name: 'Microbiología', area: 'basicas', icon: Bug, description: 'Bacterias, virus y hongos de importancia médica.' },
  { slug: 'parasitologia', name: 'Parasitología', area: 'basicas', icon: Droplets, description: 'Protozoos, helmintos y artrópodos.' },
  { slug: 'farmacologia', name: 'Farmacología', area: 'basicas', icon: Pill, description: 'Mecanismos, dosis y efectos adversos de fármacos.' },
  { slug: 'patologia', name: 'Patología', area: 'clinicas', icon: ClipboardList, description: 'Bases de la enfermedad y sus cambios en los tejidos.' },
  { slug: 'semiologia', name: 'Semiología', area: 'clinicas', icon: Stethoscope, description: 'Anamnesis, examen físico y signos clínicos.' },
  { slug: 'medicina-interna', name: 'Medicina interna', area: 'clinicas', icon: HeartPulse, description: 'Diagnóstico y manejo de enfermedades del adulto.' },
  { slug: 'cirugia', name: 'Cirugía', area: 'clinicas', icon: Scissors, description: 'Patología quirúrgica y manejo perioperatorio.' },
  { slug: 'pediatria', name: 'Pediatría', area: 'clinicas', icon: Baby, description: 'Crecimiento y enfermedades del niño.' },
  { slug: 'ginecologia-obstetricia', name: 'Ginecología y obstetricia', area: 'clinicas', icon: Heart, description: 'Salud de la mujer, embarazo y parto.' },
]

export const areaLabels: Record<Area, string> = {
  basicas: 'Ciencias básicas',
  clinicas: 'Ciencias clínicas',
}
