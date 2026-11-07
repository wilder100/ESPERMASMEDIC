export type Letter = 'A' | 'B' | 'C' | 'D' | 'E'
export const LETTERS: Letter[] = ['A', 'B', 'C', 'D', 'E']

export interface Question {
  id: string
  statement: string
  option_a: string; option_b: string; option_c: string; option_d: string; option_e: string
  correct: Letter
  explanation: string
  wrong_explanations: Partial<Record<Letter, string>>
  image_url: string | null
  difficulty: 'baja' | 'media' | 'alta'
  topics: { name: string }
}
