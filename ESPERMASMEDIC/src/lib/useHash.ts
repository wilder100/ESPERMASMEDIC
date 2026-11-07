import { useEffect, useState } from 'react'
export function useHash() {
  const [hash, setHash] = useState(window.location.hash.slice(1))
  useEffect(() => {
    const f = () => setHash(window.location.hash.slice(1))
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return hash
}
