# Padrões Globais para Criação de Formulários (SaaS multi-tenant)

Para manter o design *Premium*, responsivo e unificado em toda a plataforma, qualquer novo formulário (seja modal ou página) deve seguir as seguintes diretrizes de estrutura e classes Tailwind.

## 1. Estrutura do Modal Pai (View)
O Modal que envolve o formulário (ex: `ClientsView.tsx`, `StockView.tsx`) deve utilizar **sempre** esta exata classe em seu wrapper e container principal:

```tsx
{/* Container de fundo e Blur */}
<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
  {/* O Modal (Sempre largura flexível limitada a 4xl, altura de no max 95vh) */}
  <div className="bg-navy-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl scale-in">
    {/* Cabeçalho do Modal */}
    <div className="p-6 border-b border-slate-800 flex items-center justify-between">
      {/* ... conteúdo do header do Modal ... */}
    </div>
    
    {/* Área de rolagem para o Formulário em Si */}
    <div className="p-8 overflow-y-auto custom-scrollbar">
      <MeuNovoFormulario />
    </div>
  </div>
</div>
```

## 2. Estrutura Interna do Formulário (`MeuNovoFormulario.tsx`)
O formulário em si deve ser dividido em seções para manter a hierarquia visual limpa.

- **Classes Globais Úteis**: As classes usadas para inputs e labels devem sempre seguir esse padrão premium:
```tsx
const inputClass = "w-full bg-navy-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white font-medium focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all shadow-inner placeholder:text-slate-600";

const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1 text-left";

const sectionTitle = "text-xl font-black text-white mb-6 flex items-center gap-3";
```

### Exemplo de Seção no Form
```tsx
<div className="bg-navy-900/50 p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden group">
  {/* Elemento de background opcional para efeito visual */}
  <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-600/5 rounded-full blur-3xl group-hover:bg-primary-600/10 transition-colors" />
  
  <h4 className={sectionTitle}>
    <span className="material-symbols-outlined text-primary-600">título_do_ícone</span>
    Título da Seção
  </h4>
  
  {/* Sempre use um grid com colunas responsivas */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
    <div className="group/field">
      <label className={labelClass}>Campo de Exemplo</label>
      <input type="text" className={inputClass} placeholder="Digite algo..." />
    </div>
  </div>
</div>
```

## 3. Comportamento do Botão de Ação Primária
O Footer com os botões "Avançar", "Salvar" ou "Cancelar" sempre deve estar fixo se houver scroll interno intenso, ou posicionado como uma div no final do Form com o estilo premium.

```tsx
<div className="flex gap-4 pt-4 border-t border-slate-800 mt-8">
  <button 
    type="button" 
    className="flex-1 py-4 rounded-2xl border border-slate-800 text-slate-400 font-bold hover:bg-slate-800 transition-all"
  >
    Cancelar
  </button>
  <button 
    type="submit"
    className="flex-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-black hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all shadow-xl disabled:opacity-50"
  >
    Salvar Informações
  </button>
</div>
```

## 4. Estilo Global de CSS e Scrollbar
Sempre aplique em qualquer área de overflow a classe `custom-scrollbar` ou as pseudo-classes definidas no `app/globals.css`, garantindo que não tenhamos as scrollbars invasivas do Windows/Browser original, para manter o dark theme premium.

## 5. Áreas de Fotos
Caso utilize componente de Fotos (Logo ou Avatar), sempre use o `PhotoField`. Ele já foi atualizado para possuir aspecto expansível e 100% responsivo horizontalmente. Evite injetar margens negativas ao redor dele.
