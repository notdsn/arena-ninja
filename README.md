# Arena Ninja (projeto pessoal e privado)

Jogo de batalha tática por turnos 3x3 no estilo do clássico Naruto Arena. Uso pessoal, sem fins comerciais.
Personagens © Masashi Kishimoto / Shueisha. Retratos são SVGs originais gerados por código.

- Abrir `index.html` (site estático, sem build).
- Testes: `node tests/sim.js 300` (batalhas IA x IA), `node tests/save-test.js` (save/migração),
  `tests/e2e.js` (Playwright, viewport iPhone 11).

## Save
`localStorage['arenaNinja.save']`, versionado (`v`). **Nunca apagar saves**: para mudar o formato,
incremente `SAVE_VERSION` em `js/save.js` e adicione uma migração em `MIGRATIONS`.
Saves corrompidos são copiados para `arenaNinja.save.backup.<timestamp>` antes de qualquer coisa.

## Imagens
- `img/p/*.webp` — retratos 256x256 recortados das imagens de infobox da Narutopedia (naruto.fandom.com).
- `img/full/*.webp` — artes de corpo inteiro (PNG transparente) da Narutopedia, usadas no palco de batalha.
- `img/arena.svg` — cenário do palco (desenhado por código).
- Se uma imagem falhar, o retrato SVG gerado por código aparece no lugar.
