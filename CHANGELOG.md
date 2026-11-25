# Changelog

## 1.1.0 — 2026-11-25

### Adicionado

- Tela de acesso com usuário e senha, sessão por aba e botão **Sair da conta**.
- Script `npm run hash-password` para gerar o hash SHA-256 de uma senha.
- Testes do hash usado no login.

### Segurança

- Credenciais de produção configuradas em `.env.production`; a senha em texto puro não é versionada.
- Documentação do limite da proteção client-side em um site estático.

## 1.0.0 — 2026-11-25

### Adicionado

- Cronograma fixo até a véspera da prova, com 90 dias e ciclo semanal.
- Metas de dias por matéria e integração com o desempenho.
- Módulo de simulados com nota objetiva, redação e resumo.
- Módulo de TAF com índices masculino/feminino, metas e histórico de treinos.
- Backup/importação completa e exportação CSV.
- Projeto modular com Vite, ESLint, Prettier, testes com `node:test`, CI e deploy no GitHub Pages.
