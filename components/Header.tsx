'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed top-0 w-full z-[1000] py-4 transition-all duration-300 ${scrolled ? 'bg-[#020617]/90 backdrop-blur-md border-b border-white/5' : 'bg-transparent'}`}>
      <nav className="max-w-[1200px] mx-auto px-8 flex justify-between items-center">
        <div className="flex flex-col leading-none font-bold text-xl">
          <span className="text-white text-2xl">Fix<span className="text-accent text-2xl">Ar</span></span>
          <span className="text-[0.6rem] uppercase tracking-[2px] text-muted mt-1">Refrigeração</span>
        </div>
        <ul className="hidden md:flex gap-8 list-none">
          <li><Link href="#sobre" className="text-white hover:text-accent transition-colors text-sm font-medium">Sobre</Link></li>
          <li><Link href="#servicos" className="text-white hover:text-accent transition-colors text-sm font-medium">Serviços</Link></li>
          <li><Link href="#por-que-nos" className="text-white hover:text-accent transition-colors text-sm font-medium">Por que nós</Link></li>
          <li><Link href="#contato" className="text-white hover:text-accent transition-colors text-sm font-medium">Contato</Link></li>
        </ul>
        <Link href="/client" className="btn btn-primary">Área do Cliente</Link>
      </nav>
    </header>
  )
}
