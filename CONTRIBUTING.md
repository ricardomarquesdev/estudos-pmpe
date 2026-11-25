# Contribuindo

Obrigado pelo interesse! Este projeto é pessoal, mas sugestões e correções são bem-vindas.

## Preparação

```bash
npm ci
npm run dev
```

## Antes de abrir um PR

```bash
npm run format:check
npm run lint
npm test
npm run build
```

- Mantenha as regras de negócio em `src/services` e `src/core` sem dependência de DOM.
- Use os módulos de UI para manipulação do DOM.
- Siga o padrão de commits [Conventional Commits](https://www.conventionalcommits.org/).
- Atualize os testes quando alterar regras de plano, estatísticas, simulados, TAF ou migração de dados.
