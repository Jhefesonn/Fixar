import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fixar Refrigeração - Excelência em Climatização',
  description: 'Especialistas em instalação e manutenção de ar-condicionado residencial e comercial. Soluções técnicas de alta confiabilidade em São Paulo.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="scroll-smooth dark">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body className={`${inter.className} bg-navy-950 text-white overflow-x-hidden`}>
        {children}
      </body>
    </html>
  )
}
