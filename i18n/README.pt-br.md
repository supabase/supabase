<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--light.svg#gh-light-mode-only">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--dark.svg#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) é uma alternativa de código aberto Firebase. Estamos construindo as características do Firebase usando ferramentas de código aberto de nível empresarial.

- [x] Banco de dados hospedado de Postgres. [Docs](https://supabase.com/docs/guides/database)
- [x] Autenticação e Autorização. [Docs](https://supabase.com/docs/guides/auth)
- [x] APIs auto-geradas.
  - [x] REST. [Docs](https://supabase.com/docs/guides/api#rest-api)
  - [x] Assinaturas em tempo real. [Docs](https://supabase.com/docs/guides/api#realtime-api)
  - [x] GraphQL (Beta). [Docs](https://supabase.com/docs/guides/api#graphql-api)
- [x] Funções.
  - [x] Funções do Banco de Dados [Docs]https://supabase.com/docs/guides/database/functions)
  - [x] Funções de borda [Docs](https://supabase.com/docs/guides/functions)
- [x] Armazenamento de arquivos. [Docs](https://supabase.com/docs/guides/storage)
- [x] Painel de controle

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## Documentação

Para documentação completa, visite [supabase.com/docs](https://supabase.com/docs)

Para ver como Contribuir, visite [Primeiros Passos](../DEVELOPERS.md)

## Comunidade & Suporte

- [Fórum da comunidade](https://github.com/supabase/supabase/discussions). Melhor para: ajuda com a construção, discussões sobre melhores práticas em banco de dados.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Melhor para: problemas ou erros que você encontrar usando o Supabase.
- [Suporte por E-mail](https://supabase.com/docs/support#business-support). Melhor para: problemas com o seu banco de dados ou infraestrutura.
- [Discord](https://discord.supabase.com). Melhor para: compartilhar seus aplicativos e se divertir com a comunidade.

## Status

- [x] Alfa: Nós estamos testando Supabase com um grupo fechado de clientes.
- [x] Alfa Público: Qualquer um pode se registrar em [app.supabase.com](https://app.supabase.com). Porém seja flexível com a gente, ainda existem alguns obstáculos.
- [x] Beta Público: Estável o suficiente para a maioria dos casos não empresariais.
- [ ] Público: Pronto para produção.

Estamos atualmente na fase Beta Público. Siga as "entregas" (_releases_) deste repositório para receber uma notificação quando houver uma grande atualização (_major releases_).

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Seguir este repositório"/></kbd>

---

## Como funciona

Supabase é uma combinação de ferramentas de código aberto. Nós estamos construindo as funcionalidades do Firebase usando produtos de código aberto de nível empresarial. Se as ferramentas e comunidades existem com MIT, Apache 2 ou licenças abertas equivalentes, nós usaremos e apoiaremos tal ferramenta. Se a ferramenta não existir, nós construiremos e abriremos o código nós mesmos. Supabase não é um mapeamento 1-para-1 do Firebase. Nosso objetivo é entregar as pessoas desenvolvedoras uma experiência parecida com o Firebase usando ferramentas de código aberto.

**Arquitetura atual**

Supabase é uma [plataforma hospedada](https://app.supabase.com). Você pode se cadastrar e começar a usar Supabase sem instalar nada. Nós ainda estamos criando a experiência de trabalho local - esse é o nosso foco principal, junto com a estabilidade da plataforma.
Voce tambem pode [auto-hospedar](https://supabase.com/docs/guides/hosting/overview) e [develop locally](https://supabase.com/docs/guides/local-development).

![Arquitetura](https://user-images.githubusercontent.com/70828596/187547862-ffa9d058-0c3a-4851-a3e7-92ccfca4b596.png)

- [PostgreSQL](https://www.postgresql.org/) é um banco objeto-relational com mais de 30 anos de desenvolvimento ativo que conquistou uma forte reputação por ser confiável, robusto e de ótimo desempenho.
- [Tempo real](https://github.com/supabase/realtime) é um servidor Elixir que permite ouvir as inserções, atualizações e remoções (_inserts_, _updates_ e _deletes_) do PostgreSQL usando _websockets_. Supabase ouve as funcionalidades de replicação nativas do Postgres, converte os bytes de replicação em JSON, e propaga o JSON usando websockets.
- [PostgREST](http://postgrest.org/) é um servidor web que converte sua base de dados PostgreSQL diretamente em uma API RESTful.
- [Armazenamento](https://github.com/supabase/storage-api) oferece uma interface RESTful para gerenciar arquivos armazenados em um S3, usando Postgres para gerenciar as permissões.
- [postgres-meta](https://github.com/supabase/postgres-meta) é uma API RESTful para gerenciar seu Postgres, permitindo você carregar tabelas, adicionar permissões, executar consultas e etc.
- [GoTrue](https://github.com/netlify/gotrue) é uma API baseada em SWT para gerenciar usuários e distribuir tokens SWT.
- [Kong](https://github.com/Kong/kong) é um API _gateway_ nativo em núvem.

#### Bibliotecas de cliente

Nossa biblioteca de cliente é modular. Cada sub-biblioteca é uma implementação independente para cada sistema externo. Essa é uma das formas de apoiar as ferramentas existentes.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Linguagem</th>
    <th>Cliente</th>
    <th colspan="4">Clientes de recursos (agrupados por cliente Supabase) </th>
  </tr>
  <tr>
    <th></th>
    <th>Supabase</th>
    <th><a href="https://github.com/postgrest/postgrest" target="_blank" rel="noopener noreferrer">PostgREST</a></th>
    <th><a href="https://github.com/supabase/gotrue" target="_blank" rel="noopener noreferrer">GoTrue</a></th>
    <th><a href="https://github.com/supabase/realtime" target="_blank" rel="noopener noreferrer">Realtime</a></th>
    <th><a href="https://github.com/supabase/storage-api" target="_blank" rel="noopener noreferrer">Storage</a></th>
    <th>Funções</th>
  </tr>
  <!-- TEMPLATE FOR NEW ROW -->
  <!-- START ROW
  <tr>
    <td>lang</td>
    <td><a href="https://github.com/supabase-community/supabase-lang" target="_blank" rel="noopener noreferrer">supabase-lang</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-lang" target="_blank" rel="noopener noreferrer">postgrest-lang</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-lang" target="_blank" rel="noopener noreferrer">gotrue-lang</a></td>
    <td><a href="https://github.com/supabase-community/realtime-lang" target="_blank" rel="noopener noreferrer">realtime-lang</a></td>
    <td><a href="https://github.com/supabase-community/storage-lang" target="_blank" rel="noopener noreferrer">storage-lang</a></td>
  </tr>
  END ROW -->
  <th colspan="7">⚡️ Oficial ⚡️</th>
  <tr>
    <td>JavaScript (TypeScript)</td>
    <td><a href="https://github.com/supabase/supabase-js" target="_blank" rel="noopener noreferrer">supabase-js</a></td>
    <td><a href="https://github.com/supabase/postgrest-js" target="_blank" rel="noopener noreferrer">postgrest-js</a></td>
    <td><a href="https://github.com/supabase/gotrue-js" target="_blank" rel="noopener noreferrer">gotrue-js</a></td>
    <td><a href="https://github.com/supabase/realtime-js" target="_blank" rel="noopener noreferrer">realtime-js</a></td>
    <td><a href="https://github.com/supabase/storage-js" target="_blank" rel="noopener noreferrer">storage-js</a></td>
    <td><a href="https://github.com/supabase/functions-js" target="_blank" rel="noopener noreferrer">functions-js</a></td>
  </tr>
   <tr>
    <td>Flutter</td>
    <td><a href="https://github.com/supabase/supabase-flutter" target="_blank" rel="noopener noreferrer">supabase-flutter</a></td>
    <td><a href="https://github.com/supabase/postgrest-dart" target="_blank" rel="noopener noreferrer">postgrest-dart</a></td>
    <td><a href="https://github.com/supabase/gotrue-dart" target="_blank" rel="noopener noreferrer">gotrue-dart</a></td>
    <td><a href="https://github.com/supabase/realtime-dart" target="_blank" rel="noopener noreferrer">realtime-dart</a></td>
    <td><a href="https://github.com/supabase/storage-dart" target="_blank" rel="noopener noreferrer">storage-dart</a></td>
    <td><a href="https://github.com/supabase/functions-dart" target="_blank" rel="noopener noreferrer">functions-dart</a></td>
  </tr>
  <th colspan="7">💚 Comunidade 💚</th>
  <tr>
    <td>C#</td>
    <td><a href="https://github.com/supabase-community/supabase-csharp" target="_blank" rel="noopener noreferrer">supabase-csharp</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-csharp" target="_blank" rel="noopener noreferrer">postgrest-csharp</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-csharp" target="_blank" rel="noopener noreferrer">gotrue-csharp</a></td>
    <td><a href="https://github.com/supabase-community/realtime-csharp" target="_blank" rel="noopener noreferrer">realtime-csharp</a></td>
    <td><a href="https://github.com/supabase-community/storage-csharp" target="_blank" rel="noopener noreferrer">storage-csharp</a></td>
    <td><a href="https://github.com/supabase-community/functions-csharp" target="_blank" rel="noopener noreferrer">functions-csharp</a></td>
  </tr>
  <tr>
    <td>Go</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/postgrest-go" target="_blank" rel="noopener noreferrer">postgrest-go</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-go" target="_blank" rel="noopener noreferrer">gotrue-go</a></td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/storage-go" target="_blank" rel="noopener noreferrer">storage-go</a></td>
    <td><a href="https://github.com/supabase-community/functions-go" target="_blank" rel="noopener noreferrer">functions-go</a></td>
  </tr>
  <tr>
    <td>Java</td>
    <td>-</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/gotrue-java" target="_blank" rel="noopener noreferrer">gotrue-java</a></td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/storage-java" target="_blank" rel="noopener noreferrer">storage-java</a></td>
    <td>-</td>
  </tr>
  <tr>
    <td>Kotlin</td>
    <td><a href="https://github.com/supabase-community/supabase-kt" target="_blank" rel="noopener noreferrer">supabase-kt</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-kt" target="_blank" rel="noopener noreferrer">postgrest-kt</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-kt" target="_blank" rel="noopener noreferrer">gotrue-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Realtime" target="_blank" rel="noopener noreferrer">realtime-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Storage" target="_blank" rel="noopener noreferrer">storage-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Functions" target="_blank" rel="noopener noreferrer">functions-kt</a></td>
  </tr>
  <tr>
    <td>Python</td>
    <td><a href="https://github.com/supabase-community/supabase-py" target="_blank" rel="noopener noreferrer">supabase-py</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-py" target="_blank" rel="noopener noreferrer">postgrest-py</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-py" target="_blank" rel="noopener noreferrer">gotrue-py</a></td>
    <td><a href="https://github.com/supabase-community/realtime-py" target="_blank" rel="noopener noreferrer">realtime-py</a></td>
    <td><a href="https://github.com/supabase-community/storage-py" target="_blank" rel="noopener noreferrer">storage-py</a></td>
    <td><a href="https://github.com/supabase-community/functions-py" target="_blank" rel="noopener noreferrer">functions-py</a></td>
  </tr>
  <tr>
    <td>Ruby</td>
    <td><a href="https://github.com/supabase-community/supabase-rb" target="_blank" rel="noopener noreferrer">supabase-rb</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-rb" target="_blank" rel="noopener noreferrer">postgrest-rb</a></td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>Rust</td>
    <td>-</td>
    <td><a href="https://github.com/supabase-community/postgrest-rs" target="_blank" rel="noopener noreferrer">postgrest-rs</a></td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>Swift</td>
    <td><a href="https://github.com/supabase-community/supabase-swift" target="_blank" rel="noopener noreferrer">supabase-swift</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-swift" target="_blank" rel="noopener noreferrer">postgrest-swift</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-swift" target="_blank" rel="noopener noreferrer">gotrue-swift</a></td>
    <td><a href="https://github.com/supabase-community/realtime-swift" target="_blank" rel="noopener noreferrer">realtime-swift</a></td>
    <td><a href="https://github.com/supabase-community/storage-swift" target="_blank" rel="noopener noreferrer">storage-swift</a></td>
    <td><a href="https://github.com/supabase-community/functions-swift" target="_blank" rel="noopener noreferrer">functions-swift</a></td>
  </tr>
   <tr>
    <td>Godot Engine (GDScript)</td>
    <td><a href="https://github.com/supabase-community/godot-engine.supabase" target="_blank" rel="noopener noreferrer">supabase-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/postgrest-gdscript" target="_blank" rel="noopener noreferrer">postgrest-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/gotrue-gdscript" target="_blank" rel="noopener noreferrer">gotrue-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/realtime-gdscript" target="_blank" rel="noopener noreferrer">realtime-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/storage-gdscript" target="_blank" rel="noopener noreferrer">storage-gdscript</a></td>
    <td><a href="https://github.com/supabase-community/functions-gdscript" target="_blank" rel="noopener noreferrer">functions-gdscript</a></td>
  </tr>
</table>

## Traduções

- [Traduções](/i18n/languages.md) <!--- Keep only the this-->

---

## Patrocinadores

[![New Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
