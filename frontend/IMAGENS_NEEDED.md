# Arquivos de Imagem Necessários

Coloque os seguintes arquivos na pasta `frontend/`:

## Imagens SVG (crie arquivos simples ou use ícones do Bootstrap)

1. **coração.svg** - Ícone de coração para likes
2. **comentário.svg** - Ícone de comentário (pode ser um balão de fala)
3. **send.svg** - Ícone de enviar (seta ou envelope)
4. **Instagram.svg** - Logo do Instagram
5. **Twitter.svg** - Logo do Twitter
6. **TikTok.svg** - Logo do TikTok

## Imagens PNG

1. **ReceitasDelicia.png** - Logo da empresa (pode ser um texto simples ou imagem)
2. **default-avatar.png** - Avatar padrão para usuários sem foto

## Solução Rápida

Se você não tiver os arquivos SVG, pode usar ícones do Bootstrap Icons ou Font Awesome:

1. Adicione no `<head>` do `index.html`:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
```

2. Substitua as tags `<img>` por ícones:
- `<i class="bi bi-heart"></i>` para coração
- `<i class="bi bi-chat"></i>` para comentário
- `<i class="bi bi-send"></i>` para enviar

Ou use Font Awesome:
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

