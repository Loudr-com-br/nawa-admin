# NAWA Design System

Sistema de design oficial da **NAWA Health** — plataforma personalizada de saúde contínua que conecta pessoas a protocolos de saúde e médicos reais.

## Sobre a NAWA

NAWA é uma plataforma digital de saúde que oferece protocolos personalizados contínuos, acompanhamento médico e gestão de bem-estar. A marca é construída sobre cinco pilares:

| Pilar | Símbolo |
|---|---|
| Recuperação | + estilizado |
| Força | duplo chevron |
| Energia | seta circular |
| Foco | quadrado com detalhe |
| Longevidade | infinito |

A identidade visual é centrada no espaço entre as letras **NA** e **WA** — chamado de *portal* — que pode receber cor sólida, tagline, imagem ou vazio expandido.

> *"A barra entre NA e WA é o portal — o espaço onde a marca coloca o mundo."*

## Sobre o projeto

Este repositório é o **Design System** da NAWA, documentando todos os tokens, componentes e diretrizes visuais do produto digital.

### O que está documentado

| # | Seção | Conteúdo |
|---|---|---|
| 01 | Cores | Paleta de marca, escala de azul, neutros e cores semânticas |
| 02 | Tipografia | Escala completa com AT Aero (fallback: Poppins) |
| 03 | Espaçamento | Grid baseado em múltiplos de 4pt |
| 04 | Raio de borda | 6 níveis de arredondamento |
| 05 | Elevação & Sombra | 4 níveis de sombra + Liquid Glass |
| 06 | Motion | Durações e curvas de easing |
| 07 | Botões | Variantes, tamanhos, estados e ícones |
| 08 | Inputs | Campos, select, textarea e floating label |
| 09 | Progress & Steps | Barras de progresso, step indicator, radio e checkbox |
| 10 | Cards | Variantes de card e seleção de plano |
| 11 | Navegação | Top nav (solid e brand) e bottom navigation mobile |
| 12 | Toasts | Notificações de sucesso, erro, alerta e informação |
| 13 | Brand Assets | Assinaturas validadas, ícones de pilar e asset diagonal |
| 14 | Acessibilidade | Contraste WCAG AA, focus visible e touch targets |

## Identidade visual

- **Cor primária:** Azul NAWA `#204FF1`
- **Cor escura:** Azul Escuro `#0619AD`
- **Tipografia:** AT Aero (Arilla Type Studio) — Black 900 para display
- **Princípio estético:** sólidos, sem gradientes, espaço como elemento de design

## Stack

- [React 19](https://react.dev/)
- [TypeScript 6](https://www.typescriptlang.org/)
- [Vite 8](https://vite.dev/)
- [React Router 7](https://reactrouter.com/)

## Como rodar

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173` para ver o Design System.

```bash
npm run build   # build de produção
npm run preview # preview do build
```
