<p align="center">
  <img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-rounded-corner-background.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io) é uma alternativa de código aberto ao Firebase. Nós estamos construindo as funcionalidades do Firebase usando ferramentas de código aberto de nível empresarial.

- [x] Hospedagem Banco de dados Postgres
- [x] Subscrições em tempo real
- [x] Autenticação e autorização
- [x] APIs geradas automaticamente
- [x] Painel de controle
- [x] Armazenamento
- [ ] Funções (em breve)

## Documentação

Para documentação completa, visite [supabase.io/docs](https://supabase.io/docs)

## Comunidade & Suporte

- [Fórum da comunidade](https://github.com/supabase/supabase/discussions). Melhor para: ajuda com a construção, discussões sobre melhores práticas em banco de dados.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Melhor para: problemas ou erros que você encontrar usando o Supabase.
- [Suporte por E-mail](https://supabase.io/docs/support#business-support). Melhor para: problemas com o seu banco de dados ou infraestrutura.

## Status

- [x] Alfa: Nós estamos testando Supabase com um grupo fechado de clientes.
- [x] Alfa Público: Qualquer um pode se registrar em [app.supabase.io](https://app.supabase.io). Porém seja flexível com a gente, ainda existem alguns obstáculos.
- [x] Beta Público: Estável o suficiente para a maioria dos casos não empresariais.
- [ ] Público: Pronto para produção.

Estamos atualmente na fase Beta Público. Siga as "entregas" (_releases_) deste repositório para receber uma notificação quando houver uma grande atualização (_major releases_).

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Seguir este repositório"/></kbd>

---

## Como funciona

Supabase é uma combinação de ferramentas de código aberto. Nós estamos construindo as funcionalidades do Firebase usando produtos de código aberto de nível empresarial. Se as ferramentas e comunidades existem com MIT, Apache 2 ou licenças abertas equivalentes, nós usaremos e apoiaremos tal ferramenta. Se a ferramenta não existir, nós construiremos e abriremos o código nós mesmos. Supabase não é um mapeamento 1-para-1 do Firebase. Nosso objetivo é entregar as pessoas desenvolvedoras uma experiência parecida com o Firebase usando ferramentas de código aberto.

**Arquitetura atual**

Supabase é uma [plataforma hospedada](https://app.supabase.io). Você pode se cadastrar e começar a usar Supabase sem instalar nada. Nós ainda estamos criando a experiência de trabalho local - esse é o nosso foco principal, junto com a estabilidade da plataforma.

![Arquitetura](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/) é um banco objeto-relational com mais de 30 anos de desenvolvimento ativo que conquistou uma forte reputação por ser confiável, robusto e de ótimo desempenho.
- [Tempo real](https://github.com/supabase/realtime) é um servidor Elixir que permite ouvir as inserções, atualizações e remoções (_inserts_, _updates_ e _deletes_) do PostgreSQL usando _websockets_. Supabase ouve as funcionalidades de replicação nativas do Postgres, converte os bytes de replicação em JSON, e propaga o JSON usando websockets.
- [PostgREST](http://postgrest.org/) é um servidor web que converte sua base de dados PostgreSQL diretamente em uma API RESTful.
- [Armazenamento](https://github.com/supabase/storage-api) oferece uma interface RESTful para gerenciar arquivos armazenados em um S3, usando Postgres para gerenciar as permissões.
- [postgres-meta](https://github.com/supabase/postgres-meta) é uma API RESTful para gerenciar seu Postgres, permitindo você carregar tabelas, adicionar permissões, executar consultas e etc.
- [GoTrue](https://github.com/netlify/gotrue) é uma API baseada em SWT para gerenciar usuários e distribuir tokens SWT.
- [Kong](https://github.com/Kong/kong) é um API _gateway_ nativo em núvem.

#### Bibliotecas de cliente

Nossa biblioteca de cliente é modular. Cada sub-biblioteca é uma implementação independente para cada sistema externo. Esse é uma das formas de apoiar as ferramentas existentes.

- **`supabase-{lang}`**: Combina bibliotecas e adiciona melhorias.
  - `postgrest-{lang}`: Biblioteca de cliente para trabalhar com [PostgREST](https://github.com/postgrest/postgrest)
  - `realtime-{lang}`: Biblioteca de cliente para trabalhar com [Realtime](https://github.com/supabase/realtime)
  - `gotrue-{lang}`: Biblioteca de cliente para trabalhar com [GoTrue](https://github.com/netlify/gotrue)

| Repo                  | Oficial                                          | Comunidade                                                                                                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust` \| [`Ruby`](https://github.com/supabase/supabase-rb)                                                 |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) \| [`Ruby`](https://github.com/supabase/postgrest-rb) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust` \| `Ruby`                                                                                            |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust` \| `Ruby`                                                                                                  |

<!--- Remove this list if you're traslating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## Traduções

- [Traduções](/i18n/languages.md) <!--- Keep only the this-->

---

## Patrocinadores

[![New Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
