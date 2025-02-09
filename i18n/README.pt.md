<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) é uma alternativa de código aberto ao Firebase. Estamos construindo os recursos do Firebase usando ferramentas de código aberto de nível empresarial.

**Principais Características:**

- [x] **Banco de Dados Postgres Gerenciado:** [Documentação](https://supabase.com/docs/guides/database)
- [x] **Autenticação e Autorização:** [Documentação](https://supabase.com/docs/guides/auth)
- [x] **APIs Geradas Automaticamente:**
    - [x] REST: [Documentação](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Documentação](https://supabase.com/docs/guides/graphql)
    - [x] Assinaturas em Tempo Real: [Documentação](https://supabase.com/docs/guides/realtime)
- [x] **Funções:**
    - [x] Funções de Banco de Dados: [Documentação](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (funções na borda da rede): [Documentação](https://supabase.com/docs/guides/functions)
- [x] **Armazenamento de Arquivos:** [Documentação](https://supabase.com/docs/guides/storage)
- [x] **Ferramentas de IA, Vetores e Incorporações:** [Documentação](https://supabase.com/docs/guides/ai)
- [x] **Painel de Controle**

![Painel de Controle do Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Inscreva-se nos "releases" deste repositório para receber notificações sobre atualizações importantes. Isso permitirá que você fique por dentro das últimas alterações e melhorias.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Assistir ao repositório"/></kbd>

## Documentação

A documentação completa está disponível em [supabase.com/docs](https://supabase.com/docs). Lá você encontrará todos os guias e materiais de referência necessários.

Se você quiser contribuir com o projeto, consulte a seção [Começando](./../DEVELOPERS.md).

## Comunidade e Suporte

*   **Fórum da Comunidade:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Ideal para obter ajuda com o desenvolvimento e discutir as melhores práticas de banco de dados.
*   **Problemas do GitHub (GitHub Issues):** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Use para relatar bugs e erros que você encontrar ao usar o Supabase.
*   **Suporte por E-mail:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). A melhor opção para problemas com seu banco de dados ou infraestrutura.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Ótimo lugar para compartilhar seus aplicativos e interagir com a comunidade.

## Como Funciona

O Supabase combina várias ferramentas de código aberto. Estamos construindo recursos semelhantes aos do Firebase usando produtos comprovados de nível empresarial. Se uma ferramenta ou comunidade existir e tiver uma licença MIT, Apache 2 ou licença aberta equivalente, usaremos e apoiaremos essa ferramenta. Se a ferramenta não existir, nós a construiremos e abriremos o código-fonte. O Supabase não é uma cópia exata do Firebase. Nosso objetivo é fornecer aos desenvolvedores uma experiência semelhante ao Firebase, mas usando ferramentas de código aberto.

**Arquitetura**

O Supabase é uma [plataforma gerenciada](https://supabase.com/dashboard). Você pode se inscrever e começar a usar o Supabase imediatamente sem instalar nada. Você também pode [implantar sua própria infraestrutura](https://supabase.com/docs/guides/hosting/overview) e [desenvolver localmente](https://supabase.com/docs/guides/local-development).

![Arquitetura](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Um sistema de banco de dados objeto-relacional com mais de 30 anos de história de desenvolvimento ativo. É conhecido por sua confiabilidade, funcionalidade e desempenho.
*   **Realtime:** Um servidor Elixir que permite escutar as alterações do PostgreSQL (inserções, atualizações e exclusões) por meio de websockets. O Realtime usa a funcionalidade de replicação integrada do Postgres, converte as alterações em JSON e as transmite para clientes autorizados.
*   **PostgREST:** Um servidor web que transforma seu banco de dados PostgreSQL em uma API RESTful.
*   **GoTrue:** Uma API baseada em JWT para gerenciar usuários e emitir tokens JWT.
*   **Storage:** Fornece uma interface RESTful para gerenciar arquivos armazenados no S3, usando o Postgres para gerenciar permissões.
*   **pg_graphql:** Uma extensão do PostgreSQL que fornece uma API GraphQL.
*   **postgres-meta:** Uma API RESTful para gerenciar seu Postgres, permitindo que você obtenha tabelas, adicione funções, execute consultas, etc.
*   **Kong:** Um gateway de API nativo da nuvem.

#### Bibliotecas do Cliente

Usamos uma abordagem modular para as bibliotecas do cliente. Cada sub-biblioteca é projetada para funcionar com um único sistema externo. Esta é uma das maneiras pelas quais apoiamos as ferramentas existentes.

(Tabela com bibliotecas do cliente, como no original, mas com nomes em português e explicações onde necessário).

| Linguagem                       | Cliente Supabase                                                   | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Oficiais⚡️**         |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Apoiadas pela Comunidade💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Selos (Badges)

Você pode usar esses selos para mostrar que seu aplicativo foi construído com o Supabase:

**Claro:**

![Feito com Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Feito com Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Feito com Supabase" />
</a>
```

**Escuro:**

![Feito com Supabase (versão escura)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Feito com Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Feito com Supabase" />
</a>
```

## Traduções

[Lista de traduções](./languages.md)
