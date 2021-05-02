<p align="center">
    <img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-with-background.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io) é uma alternativa al Firebase de código aberto. Estamos reproduzindo as funcionalidades do Firebase usando ferramentas de código aberto de nivel empresarial.

- [x] Banco de dados hospedado Postgres
- [x] Subscrições em tempo real
- [x] Autenticação e autorização
- [x] APIs geradas automaticamente
- [x] Painel/Dashboard
- [x] Armazenamento
- [ ] Funções (em breve)

## Documentação

Para ver a documentação completa, visite [supabase.io/docs](https://supabase.io/docs)

## Comunidade & Suporte

- [Fórum da comunidade](https://github.com/supabase/supabase/discussions). Indicado para: ajuda no desenvolviment, discussão sobre as melhores práticas de banco de dados.
- [Problemas do GitHub](https://github.com/supabase/supabase/issues). Indicado para: bugs e erros que você encontrar ao usar o Supabase.
- [Suporte por e-mail](https://supabase.io/docs/support#business-support). Indicado para: problemas com seu banco de dados ou infraestrutura.


## Status

- [x] Alpha: estamos testando o Supabase com um grupo fechado de clientes
- [x] Alpha Público: Qualquer pessoa pode se inscrever em [app.supabase.io](https://app.supabase.io). Mas vá com calma, existem alguns problemas ainda.
- [x] Beta público: estável o suficiente para a maioria dos casos de uso não empresariais
- [ ] Público: pronto para produção

Estamos atualmente em Beta Público. Assista aos "releases" deste repositório para ser notificado sobre as principais atualizações.

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Como funciona

Supabase é uma combinação de ferramentas de código aberto. Estamos construindo os recursos do Firebase usando produtos de código aberto de nível empresarial. Se as ferramentas e comunidades existirem, com uma licença MIT, Apache 2 ou licença aberta equivalente, usaremos e ofereceremos suporte para essa ferramenta. Se a ferramenta não existir, nós mesmos a construímos e abrimos o código-fonte. Supabase não é uma reprodução 1 para 1 do Firebase. Nosso objetivo é dar aos desenvolvedores uma experiência de desenvolvedor semelhante ao Firebase usando ferramentas de código aberto.

**Arquitetura atual**

Supabase é uma [plataforma hospedada](https://app.supabase.io). Você pode se inscrever e começar a usar o Supabase sem instalar nada. Ainda estamos criando a experiência de desenvolvimento local - agora esse é nosso foco principal, junto com a estabilidade da plataforma.

! [Arquitetura](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/) é um sistema de banco de dados objeto-relacional com mais de 30 anos de desenvolvimento ativo que lhe rendeu uma forte reputação de confiabilidade, robustez de recursos e desempenho.
- [Realtime](https://github.com/supabase/realtime) é um servidor Elixir que permite ouvir inserções, atualizações e exclusões PostgreSQL usando websockets. Supabase escuta a funcionalidade de replicação embutida do Postgres, converte o fluxo de bytes de replicação em JSON e, em seguida, transmite o JSON através de websockets.
- [PostgREST](http://postgrest.org/) é um servidor web que transforma seu banco de dados PostgreSQL diretamente em uma API RESTful
- [Storage](https://github.com/supabase/storage-api) fornece uma interface RESTful para gerenciar arquivos armazenados no S3, usando Postgres para gerenciar permissões.
- [postgres-meta](https://github.com/supabase/postgres-meta) é uma API RESTful para gerenciar seu Postgres, permitindo que você busque tabelas, adicione funções e execute consultas etc.
- [GoTrue](https://github.com/netlify/gotrue) é uma API baseada em SWT para gerenciar usuários e emitir tokens SWT.
- [Kong](https://github.com/Kong/kong) é um gateway de API nativo da nuvem.

#### Bibliotecas Cliente

Nossa biblioteca cliente é modular. Cada sub-biblioteca é uma implementação independente para um único sistema externo. Esta é uma das maneiras pelas quais oferecemos suporte às ferramentas existentes.

- **`supabase-{lang}`**: Combina bibliotecas e adiciona funcionalidades.
   - `postgrest-{lang}`: Biblioteca cliente para trabalhar com [PostgREST](https://github.com/postgrest/postgrest)
   - `realtime-{lang}`: Biblioteca cliente para trabalhar com [Realtime](https://github.com/supabase/realtime)
   - `gotrue-{lang}`: Biblioteca cliente para trabalhar com [GoTrue](https://github.com/netlify/gotrue)

| Repositório           | Oficial                                          | Comunidade                                                                                                                                                                                                                 |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust`                                                |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust`                                                |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust`                                                      |

<!--- Remove this list if youre translation for another language, its hard to keep updated across multiple files -->
<!--- Keep only the link to the list of translation files-->
## Traduções

- [Traduções](/i18n/languages.md) <!--- Keep only the this-->

---

## Patrocinadores

[![Novo Patrocinador](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
