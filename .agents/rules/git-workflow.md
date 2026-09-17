# Diretriz de Publicação no Git (GitHub)

Sempre que concluir a implementação de uma funcionalidade, correção de bugs, ajustes visuais ou qualquer alteração solicitada pelo usuário:

1. **Validar integridade do projeto**:
   - Rodar build / testes necessários para garantir que nada foi quebrado.
2. **Commit e Push Automático ao Final**:
   - Fazer o stage dos arquivos modificados/criados (`git add -A`).
   - Criar um commit com mensagem clara e objetiva seguindo o padrão Conventional Commits (ex: `feat: ...`, `fix: ...`).
   - Fazer o envio para o repositório remoto (`git push origin <branch_atual>`).
   - Informar ao usuário o hash do commit e confirmação do envio.
