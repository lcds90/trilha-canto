# Contexto 18 — Design System e Estilização

> Referência de design visual para estilizar todos os componentes do app. Use ao implementar CSS em qualquer componente.

## Paleta de Cores

| Token | Valor | Uso |
|-------|-------|-----|
| `bg-primary` | `#080816` | Background principal (corpo, cena 3D) |
| `bg-card` | `rgba(30, 30, 60, 0.7)` | Cards dos nós (glassmorphism) |
| `bg-card-hover` | `rgba(30, 30, 60, 0.85)` | Cards ao hover |
| `bg-input` | `rgba(20, 20, 40, 0.8)` | Campos de input |
| `bg-header` | `rgba(8, 8, 22, 0.8)` | Header e player bar |
| `bg-modal` | `rgba(20, 20, 45, 0.95)` | Fundo do Dialog/modal |
| `accent-yellow` | `#ffe500` | Nós ativos, títulos, destaques |
| `accent-blue` | `#3b82f6` | Caminho 3D, links, interativos |
| `accent-green` | `#22c55e` | Completado, streak, sucesso |
| `accent-purple` | `#8b5cf6` | IA, análise, badges |
| `accent-red` | `#ef4444` | Erros, bloqueio, remover |
| `text-primary` | `#e2e8f0` | Texto principal (slate-200) |
| `text-secondary` | `#94a3b8` | Texto secundário (slate-400) |
| `text-muted` | `#475569` | Placeholders, desabilitado (slate-600) |
| `text-dark` | `#64748b` | Texto muito sutil (slate-500) |
| `border-subtle` | `rgba(255, 229, 0, 0.12)` | Bordas de card padrão |
| `border-active` | `#ffe500` | Borda do nó ativo |
| `border-completed` | `rgba(34, 197, 94, 0.35)` | Borda de nó completado |

## Efeitos Visuais

### Glassmorphism
```css
background: rgba(30, 30, 60, 0.7);
backdrop-filter: blur(8px);
```

### Header/Player Blur
```css
background: rgba(8, 8, 22, 0.8);
backdrop-filter: blur(12px);
```

### Modal Blur
```css
background: rgba(20, 20, 45, 0.95);
backdrop-filter: blur(16px);
```

### Glow Ativo (Amarelo)
```css
box-shadow: 0 0 30px rgba(255, 229, 0, 0.12);
```

### Glow Completado (Verde)
```css
box-shadow: 0 0 20px rgba(34, 197, 94, 0.15);
```

### Hover Elevação
```css
transform: translateY(-2px);
box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
```

### Transições Padrão
```css
transition: all 0.3s ease;     /* Cards, glow */
transition: all 0.2s ease;     /* Botões, inputs */
transition: width 0.4s ease;   /* Barras de progresso */
transition: width 0.5s ease;   /* Barra do player */
```

## Tipografia

| Elemento | Size | Weight | Color |
|----------|------|--------|-------|
| App title (h1) | `1.4rem` | `700` | `text-primary` |
| Node title (h2) | `1.05rem` | `600` | `text-primary` |
| Modal header | `1.25rem` | `700` | `accent-yellow` |
| Body text | `0.9rem` | `400` | `text-primary` |
| Caption/label | `0.75rem` | `500` | `text-secondary` |
| Tiny text | `0.7rem` | `400` | `text-dark` |
| Button | `0.85rem` | `600` | `accent-yellow` |

**Font Stack:**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

## Border Radius

| Elemento | Valor |
|----------|-------|
| Cards | `16px` |
| Modal | `20px` |
| Buttons | `10px` |
| Inputs | `8px` |
| Badges/tags | `6px` |
| Progress bars | `3px` |
| Calendário day | `3px` |
| Checkbox | `6px` |

## Cena 3D — Cores

| Elemento | Cor | Comportamento |
|----------|-----|--------------|
| Background | `0x080816` | Fixo |
| Fog | `0x080816, density 0.015` | Depth fade |
| Ambient Light | `0x404080, intensity 0.4` | Azulado suave |
| Nó ativo | `emissive 0xffe500, intensity 0.4±0.15` | Pulsa |
| Nó completado | `emissive 0x22c55e, intensity 0.15` | Verde estável |
| Nó inativo | `emissive 0xffe500, intensity 0.03` | Quase apagado |
| Caminho | `0x3b82f6, emissive 0.3` | Azul translúcido |
| Partículas | `0xaaaaff, size 0.08, opacity 0.5` | Rotação lenta |

## Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER (sticky top, blur)                                     │
│ ┌──────────────────────────────┐  ┌────────────────────────┐ │
│ │ 🎵 Trilha de Prática de Canto│  │ 🔥 5 dias  [cal grid] │ │
│ └──────────────────────────────┘  └────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  3D Canvas (fixed background, z-index: 0)                   │
│                                                              │
│  ┌──── OVERLAY (z-index: 1) ─────────────────────────────┐  │
│  │                                                        │  │
│  │  ┌────────────────────────────────────┐                │  │
│  │  │ 01  Tempo flexível            ✓   │  ← node-card   │  │
│  │  │ Respiração e Suporte              │                 │  │
│  │  │ [████████░░] 3/4                  │                 │  │
│  │  └────────────────────────────────────┘                │  │
│  │                                                        │  │
│  │  ┌────────────────────────────────────┐                │  │
│  │  │ 02  +/- 15 min          ← active  │  ← glow border │  │
│  │  │ Aquecimento Corporal              │                 │  │
│  │  │ [███░░░░░░░] 1/3                  │                 │  │
│  │  └────────────────────────────────────┘                │  │
│  │                                                        │  │
│  │  ... (mais nós) ...                                    │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ PLAYER BAR (fixed bottom, blur)                              │
│ [████░░░░] 1/5  │ ⏮  ▶  ⏭  Auto │ Aquecim. Corporal │ ⏱️  │
└──────────────────────────────────────────────────────────────┘
```

## Responsividade (Breakpoints)

```css
/* Mobile: <= 640px */
@media (max-width: 640px) {
  /* Player bar: wrap controls, active-info full width on top */
  /* Node cards: smaller padding */
}

/* Tablet: <= 768px */
@media (max-width: 768px) {
  /* Header: stack vertically */
  /* Streak panel: center aligned */
  /* Calendar days: smaller */
}
```

## Acessibilidade

- Todos os botões interativos devem ter `title` ou `aria-label`
- Links externos: `target="_blank" rel="noopener noreferrer"`
- Checkbox: usa HTML Nativo Checkbox (acessível por padrão)
- Cores de contraste: texto principal (#e2e8f0) em fundo escuro (#080816) = ratio ~13:1 ✓
- Emoji como decoração, não como conteúdo único (sempre acompanhado de texto)
