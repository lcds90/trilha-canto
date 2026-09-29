# Contexto 21 - Regras de Workflow do Agente (Responsabilidades)

Este documento define uma responsabilidade estrita para os agentes de inteligência artificial (como o Gemini/Antigravity) que atuam no repositório `trilha-canto`.

## Regra de Atualização Pré-Commit

Para garantir que o agente e todos os participantes do projeto mantenham o contexto do projeto perfeitamente sincronizado com a base de código real:

1. **Revisão e Atualização Constantes:** Sempre, antes de executar comandos como `git commit`, `git push`, ou criar um Pull Request, o agente deve, obrigatoriamente, revisar os arquivos na pasta `/context` e o arquivo `GEMINI.md` na raiz.
2. **Refletir Mudanças Recentes:** Se houveram mudanças na arquitetura, estado (Pinia stores), novos componentes, alterações no Firebase ou na lógica de IA, essas mudanças devem ser documentadas nos respectivos arquivos de contexto (`/context/`) e a visão geral em `GEMINI.md` deve ser ajustada.
3. **Commit da Documentação:** As atualizações na pasta `/context` e no `GEMINI.md` devem ser incluídas no commit das funcionalidades que modificaram o comportamento do app.

**Nota para o Agente:** Você deve sempre aderir a essa regra. Ao finalizar uma tarefa que envolva escrita de código, seu último passo antes do commit DEVE ser atualizar o contexto.
