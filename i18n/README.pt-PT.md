<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) é uma alternativa open source ao Firebase. Estamos a construir as funcionalidades do Firebase usando ferramentas open source de nível empresarial.

- [x] Base de dados Postgres alojada. [Docs](https://supabase.com/docs/guides/database)
- [x] Autenticação e autorização. [Docs](https://supabase.com/docs/guides/auth)
- [x] APIs geradas automaticamente.
  - [x] REST. [Docs](https://supabase.com/docs/guides/api#rest-api-overview)
  - [x] GraphQL. [Docs](https://supabase.com/docs/guides/api#graphql-api-overview)
  - [x] Assinaturas em tempo real. [Docs](https://supabase.com/docs/guides/api#realtime-api-overview)
- [x] Funções.
  - [x] Funções de base de dados. [Docs](https://supabase.com/docs/guides/database/functions)
  - [x] Funções de Borda [Docs](https://supabase.com/docs/guides/functions)
- [x] Armazenamento de Ficheiros. [Docs](https://supabase.com/docs/guides/storage)
- [x] Painel de controlo

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## Documentação

Para documentação completa, visite [supabase.com/docs](https://supabase.com/docs)

Para ver como contribuir, visite [Getting Started](../DEVELOPERS.md)

## Comunidade & Suporte

- [Fórum da Comunidade](https://github.com/supabase/supabase/discussions). Melhor para: ajuda com a construção, discussão sobre as melhores práticas de banco de dados.
- [Problemas no GitHub](https://github.com/supabase/supabase/issues). Melhor para: bugs e erros que encontra ao usar o Supabase.
- [Suporte por Email](https://supabase.com/docs/support#business-support). Melhor para: problemas com a sua base de dados ou infra-estrutura.
- [Discord](https://discord.supabase.com). Ideal para: partilhar as suas aplicações e conviver com a comunidade.

## Status

- [x] Alfa: Estamos a testar o Supabase com um conjunto fechado de clientes
- [x] Alfa Público: Qualquer pessoa pode inscrever-se em [supabase.com/dashboard](https://supabase.com/dashboard). Mas vá com calma, ainda há alguns problemas
- [x] Beta Público: Estável o suficiente para a maioria dos casos de uso não empresarial
- [ ] Público: Disponibilidade geral [[status](https://supabase.com/docs/guides/getting-started/features#feature-status)]

Estamos actualmente em Beta Pública. Veja "releases" deste repositório para ser notificado das principais actualizações.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Como funciona

O Supabase é uma combinação de ferramentas de código aberto. Estamos a construir as funcionalidades do Firebase usando produtos open source de nível empresarial. Se as ferramentas e as comunidades existirem, com uma licença MIT, Apache 2, ou equivalente, nós usaremos e apoiaremos essa ferramenta. Se a ferramenta não existir, nós próprios a construímos e tornamos o código aberto. O Supabase não é um mapeamento 1 para 1 do Firebase. O nosso objectivo é dar aos programadores uma experiência semelhante à do Firebase usando ferramentas de código aberto.

**Arquitectura**

Supabase é uma [plataforma alojada](https://supabase.com/dashboard). Pode registar-se e começar a usar o Supabase sem instalar nada.
Pode também [auto-hospedar](https://supabase.com/docs/guides/hosting/overview) e [desenvolver localmente](https://supabase.com/docs/guides/local-development).

![Arquitectura](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.svg)

- [PostgreSQL](https://www.postgresql.org/) é um sistema de base de dados objecto-relacional com mais de 30 anos de desenvolvimento activo que lhe valeu uma forte reputação de fiabilidade, robustez de características e desempenho.
- [Realtime](https://github.com/supabase/realtime) é um servidor Elixir que permite ouvir inserções, atualizações e exclusões do PostgreSQL usando websockets. Realtime pesquisa a funcionalidade de replicação embutida do Postgres para mudanças no banco de dados, converte as mudanças para JSON, e então transmite o JSON através de websockets para clientes autorizados.
- [PostgREST](http://postgrest.org/) é um servidor web que transforma seu banco de dados PostgreSQL diretamente em uma API RESTful
- [pg_graphql](http://github.com/supabase/pg_graphql/) uma extensão do PostgreSQL que expõe uma API GraphQL
- [Storage](https://github.com/supabase/storage-api) fornece uma interface RESTful para gerir ficheiros armazenados no S3, utilizando o Postgres para gerir permissões.
- [postgres-meta](https://github.com/supabase/postgres-meta) é uma API RESTful para gerenciar seu Postgres, permitindo que você busque tabelas, adicione funções e execute consultas, etc.
- [GoTrue](https://github.com/netlify/gotrue) é uma API baseada em SWT para gerir utilizadores e emitir tokens SWT.
- [Kong](https://github.com/Kong/kong) é um gateway de API nativo da nuvem.

#### Bibliotecas de cliente

A nossa abordagem para as bibliotecas de clientes é modular. Cada sub-biblioteca é uma implementação autónoma para um único sistema externo. Esta é uma das formas de apoiarmos as ferramentas existentes.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Linguagem</th>
    <th>Cliente</th>
    <th colspan="5">Feature-Clients (incluídos no cliente Supabase)</th>
  </tr>
  
  <tr>
    <th></th>
    <th>Supabase</th>
    <th><a href="https://github.com/postgrest/postgrest" target="_blank" rel="noopener noreferrer">PostgREST</a></th>
    <th><a href="https://github.com/supabase/gotrue" target="_blank" rel="noopener noreferrer">GoTrue</a></th>
    <th><a href="https://github.com/supabase/realtime" target="_blank" rel="noopener noreferrer">Realtime</a></th>
    <th><a href="https://github.com/supabase/storage-api" target="_blank" rel="noopener noreferrer">Storage</a></th>
    <th>Functions</th>
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
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/Postgrest" target="_blank" rel="noopener noreferrer">postgrest-kt</a></td>
    <td><a href="https://github.com/supabase-community/supabase-kt/tree/master/GoTrue" target="_blank" rel="noopener noreferrer">gotrue-kt</a></td>
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

<!--- Remove this list if you're translating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## Traduções

- [Árabe | العربية](/i18n/README.ar.md)
- [Albanês / Shqip](/i18n/README.sq.md)
- [Bangla / বাংলা](/i18n/README.bn.md)
- [Búlgaro / Български](/i18n/README.bg.md)
- [Catalão / Català](/i18n/README.ca.md)
- [Dinamarquês / Dansk](/i18n/README.da.md)
- [Holandês / Nederlands](/i18n/README.nl.md)
- [Inglês](https://github.com/supabase/supabase)
- [Finlandês / Suomalainen](/i18n/README.fi.md)
- [Francês / Français](/i18n/README.fr.md)
- [Alemão / Deutsch](/i18n/README.de.md)
- [Grego / Ελληνικά](/i18n/README.gr.md)
- [Hebraico / עברית](/i18n/README.he.md)
- [Hindi / हिंदी](/i18n/README.hi.md)
- [Húngaro / Magyar](/i18n/README.hu.md)
- [Nepali / नेपाली](/i18n/README.ne.md)
- [Indonésio / Bahasa Indonésia](/i18n/README.id.md)
- [Italiano / Italiano](/i18n/README.it.md)
- [Japonês / 日本語](/i18n/README.jp.md)
- [Coreano / 한국어](/i18n/README.ko.md)
- [Malaio / Bahasa Malaysia](/i18n/README.ms.md)
- [Norueguês (Bokmål) / Norsk (Bokmål)](/i18n/README.nb-no.md)
- [Persa / فارسی](/i18n/README.fa.md)
- [Polaco / Polski](/i18n/README.pl.md)
- [Português / Português](/i18n/README.pt.md)
- [Português (brasileiro) / Português Brasileiro](/i18n/README.pt-br.md)
- [Romeno / Română](/i18n/README.ro.md)
- [Russo / Pусский](/i18n/README.ru.md)
- [Sérvio / Srpski](/i18n/README.sr.md)
- [Sinhala / සිංහල](/i18n/README.si.md)
- [Espanhol / Español](/i18n/README.es.md)
- [Chinês simplificado / 简体中文](/i18n/README.zh-cn.md)
- [Sueco / Svenska](/i18n/README.sv.md)
- [Tailandês / ไทย](/i18n/README.th.md)
- [Chinês tradicional / 繁體中文](/i18n/README.zh-tw.md)
- [Turco / Türkçe](/i18n/README.tr.md)
- [Ucraniano / Українська](/i18n/README.uk.md)
- [Vietnamita / Tiếng Việt](/i18n/README.vi-vn.md)
- [Lista de traduções](/i18n/languages.md) <!--- Keep only this -->

---

## Patrocinadores

[![Novo Patrocinador](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
