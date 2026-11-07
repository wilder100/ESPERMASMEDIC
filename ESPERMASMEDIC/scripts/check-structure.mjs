// Se ejecuta antes de "npm run build" (prebuild). Da un error claro si la carpeta del proyecto está mal subida.
import { existsSync, readdirSync } from 'node:fs'
const required = ['index.html', 'tsconfig.json', 'vite.config.ts', 'src/main.tsx', 'src/App.tsx']
const missing = required.filter((f) => !existsSync(f))
if (missing.length) {
  console.error(`\nERROR de estructura: faltan archivos en ${process.cwd()}:\n - ${missing.join('\n - ')}`)
  console.error('\nContenido de esta carpeta:', readdirSync('.').join(', '))
  console.error('\nSolución: package.json, index.html y la carpeta src/ deben estar juntos en la raíz del repositorio,')
  console.error('o configura en Cloudflare Pages "Root directory" con la subcarpeta que los contiene.\n')
  process.exit(1)
}
console.log('Estructura del proyecto correcta.')
