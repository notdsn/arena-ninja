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
