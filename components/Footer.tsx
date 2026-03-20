import Link from 'next/link'
import { Facebook, Instagram, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#020617] to-[#01040f] py-20 border-t border-white/5 relative">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div className="space-y-6">
            <div className="flex flex-col leading-none font-bold">
              <span className="text-white text-2xl">Fix<span className="text-accent text-2xl">Ar</span></span>
              <span className="text-[0.6rem] uppercase tracking-[2px] text-muted mt-1">Refrigeração</span>
            </div>
            <p className="text-muted text-sm leading-relaxed max-w-xs">
              Comprometidos em oferecer as melhores soluções de climatização e refrigeração do mercado, com foco em tecnologia e sustentabilidade.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="w-10 h-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-muted hover:bg-primary hover:text-white transition-all">
                <Facebook size={18} />
              </Link>
              <Link href="#" className="w-10 h-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-muted hover:bg-primary hover:text-white transition-all">
                <Instagram size={18} />
              </Link>
              <Link href="#" className="w-10 h-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-muted hover:bg-primary hover:text-white transition-all">
                <Twitter size={18} />
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 relative pb-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-8 after:h-0.5 after:bg-accent">Links Úteis</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-muted hover:text-white text-sm transition-all hover:pl-1">Início</Link></li>
              <li><Link href="#sobre" className="text-muted hover:text-white text-sm transition-all hover:pl-1">Sobre Nós</Link></li>
              <li><Link href="#servicos" className="text-muted hover:text-white text-sm transition-all hover:pl-1">Serviços</Link></li>
              <li><Link href="#contato" className="text-muted hover:text-white text-sm transition-all hover:pl-1">Contato</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 relative pb-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-8 after:h-0.5 after:bg-accent">Suporte</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-muted hover:text-white text-sm transition-all hover:pl-1">FAQ</Link></li>
              <li><Link href="#" className="text-muted hover:text-white text-sm transition-all hover:pl-1">Privacidade</Link></li>
              <li><Link href="#" className="text-muted hover:text-white text-sm transition-all hover:pl-1">Termos de Uso</Link></li>
              <li><Link href="/admin" className="text-muted hover:text-white text-sm transition-all hover:pl-1">Área do Administrador</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-muted text-xs gap-4">
          <p>&copy; 2026 Fixar Refrigeração. Todos os direitos reservados.</p>
          <p>Desenvolvido com foco em <strong className="text-white">excelência</strong>.</p>
        </div>
      </div>
    </footer>
  )
}
