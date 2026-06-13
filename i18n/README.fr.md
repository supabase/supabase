<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) est une alternative open source à Firebase. Nous construisons les fonctionnalités de Firebase en utilisant des outils open source de niveau entreprise.

- [x] Base de données Postgres hébergée. [Docs](https://supabase.com/docs/guides/database)
- [x] Authentication et authorisation. [Docs](https://supabase.com/docs/guides/auth)
- [x] API générées automatiquement.
  - [x] REST. [Docs](https://supabase.com/docs/guides/api#rest-api-overview)
  - [x] GraphQL. [Docs](https://supabase.com/docs/guides/api#graphql-api-overview)
  - [x] Abonnements en temps réel. [Docs](https://supabase.com/docs/guides/api#realtime-api-overview)
- [x] Functions.
  - [x] Functions de base de données. [Docs](https://supabase.com/docs/guides/database/functions)
  - [x] Functions Edge [Docs](https://supabase.com/docs/guides/functions)
- [x] Stockage de fichiers. [Docs](https://supabase.com/docs/guides/storage)
- [x] Tableau de bord

![Tableau de bord Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## Documentation

Pour une documentation complète, visitez [supabase.com/docs](https://supabase.com/docs)

Pour savoir comment contribuer, visitez [Getting Started](../DEVELOPERS.md)

## Communauté et support

- [Forum communautaire](https://github.com/supabase/supabase/discussions). Idéal pour : l'aide à la construction, la discussion sur les meilleures pratiques en matière de base de données.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Idéal pour : les bugs et les erreurs que vous rencontrez en utilisant Supabase.
- [Support par email](https://supabase.com/docs/support#business-support). Idéal pour : les problèmes avec votre base de données ou votre infrastructure.
- [Discord](https://discord.supabase.com). Le meilleur pour : partager vos applications et passer du temps avec la communauté.

## Statut

- [x] Alpha : Nous testons Supabase avec un groupe fermé de clients
- [x] Alpha publique : Tout le monde peut s'inscrire sur [supabase.com/dashboard](https://supabase.com/dashboard). Mais allez-y doucement, il y a quelques problèmes
- [x] Bêta publique : Suffisamment stable pour la plupart des cas d'utilisation hors entreprise
- [ ] Public : Disponibilité générale [[status](https://supabase.com/docs/guides/getting-started/features#feature-status)]

Nous sommes actuellement en bêta publique. Surveillez les "releases" de ce repo pour être informé des mises à jour majeures.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Comment ça marche

Supabase est une combination d'outils open source. Nous construisons les fonctionnalités de Firebase en utilisant des produits open source de qualité professionnelle. Si les outils et les communautés existent, avec une licence MIT, Apache 2, ou une licence ouverte équivalente, nous utiliserons et supporterons cet outil. Si l'outil n'existe pas, nous le construisons et l'ouvrons nous-mêmes. Supabase n'est pas un mapping 1 pour 1 de Firebase. Notre objectif est de donner aux développeurs une expérience de développement similaire à cell de Firebase en utilisant des outils open source.

**Architecture**

Supabase est une [plateforme hébergée](https://supabase.com/dashboard). Vous pouvez vous inscrire et commencer à utiliser Supabase sans rien installer.
Vous pouvez également [auto-héberger](https://supabase.com/docs/guides/hosting/overview) et [développer localement](https://supabase.com/docs/guides/local-development).

![Architecture](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.svg)

- [PostgreSQL](https://www.postgresql.org/) est un système de base de données objet-relationnel avec plus de 30 and de développement actif qui lui a value une solide réputation de fiabilité, de robustesse et de performance.
- [Realtime](https://github.com/supabase/realtime) est un serveur Elixir qui vous permet d'écouter les insertions, les mises à jour et les suppressions de PostgreSQL en utilisant des websockets. Realtime interroge la fonctionnalité de réplication intégrée de Postgres pour les changements de base de données, convertit les changements en JSON, puis diffuse le JSON via des websockets aux clients autorisés.
- [PostgREST](http://postgrest.org/) est un serveur web qui transforme votre base de données PostgreSQL en une API RESTful
- [pg_graphql](http://github.com/supabase/pg_graphql/) est une extension de PostgreSQL qui expose une API GraphQL
- [Storage](https://github.com/supabase/storage-api) fournit une interface RESTful pour gérer les fichiers stockés dans S3, en utilisant Postgres pour gérer les permissions.
- [postgres-meta](https://github.com/supabase/postgres-meta) est une API RESTful pour gérer votre Postgres, vous permettant de récupérer des tables, d'ajouter des rôles, et d'exécuter des requêtes, etc.
- [GoTrue](https://github.com/netlify/gotrue) est une API basée sur SWT pour gérer les utilisateurs et émettre des jetons SWT.
- [Kong](https://github.com/Kong/kong) est une passerelle API native.

#### Bibliothèques client

Notre approach des bibliothèques clientes est modulaire. Chaque sous-bibliothèque est une implémentation autonome pour un seul système externe. C'est l'une des façons dont nous soutenons les outils existants.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Langue</th>
    <th>Client</th>
    <th colspan="5">Feature-Clients (intégrés dans le client Supabase)</th>
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
  
  <th colspan="7">⚡️ Officiel ⚡️</th>
  
  <tr>
    <td>JavaScript (TypeScript)</td>
    <td><a href="https://github.com/supabase/supabase-js" target="_blank" rel="noopener noreferrer">supabase-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/postgrest-js" target="_blank" rel="noopener noreferrer">postgrest-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/auth-js" target="_blank" rel="noopener noreferrer">auth-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/realtime-js" target="_blank" rel="noopener noreferrer">realtime-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/storage-js" target="_blank" rel="noopener noreferrer">storage-js</a></td>
    <td><a href="https://github.com/supabase/supabase-js/tree/master/packages/core/functions-js" target="_blank" rel="noopener noreferrer">functions-js</a></td>
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
  
  <th colspan="7">💚 Community 💚</th>
  
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

## Traductions

- [Arabe | العربية](/i18n/README.ar.md)
- [Albanais / Shqip](/i18n/README.sq.md)
- [Bangla / বাংলা](/i18n/README.bn.md)
- [Bulgare / Български](/i18n/README.bg.md)
- [Catalan / Català](/i18n/README.ca.md)
- [Danois / Dansk](/i18n/README.da.md)
- [néerlandais / Nederlands](/i18n/README.nl.md)
- [anglais](https://github.com/supabase/supabase)
- [Finnish / Suomalainen](/i18n/README.fi.md)
- [French / Français](/i18n/README.fr.md)
- [German / Deutsch](/i18n/README.de.md)
- [Grec / Ελληνικά](/i18n/README.gr.md)
- [Hébreu / עברית](/i18n/README.he.md)
- [Hindi / हिंदी](/i18n/README.hi.md)
- [Hongrois / Magyar](/i18n/README.hu.md)
- [Népalais / नेपाली](/i18n/README.ne.md)
- [Indonésien / Bahasa Indonesia](/i18n/README.id.md)
- [Italien / Italiano](/i18n/README.it.md)
- [Japonais / 日本語](/i18n/README.jp.md)
- [Coréen / 한국어](/i18n/README.ko.md)
- [Malais / Bahasa Malaysia](/i18n/README.ms.md)
- [Norvégien (Bokmål) / Norsk (Bokmål)](/i18n/README.nb-no.md)
- [Persan / فارسی](/i18n/README.fa.md)
- [Polonais / Polski](/i18n/README.pl.md)
- [Portugais / Português](/i18n/README.pt.md)
- [Portugais (brésilien) / Português Brasileiro](/i18n/README.pt-br.md)
- [Roumain / Română](/i18n/README.ro.md)
- [Russe / Pусский](/i18n/README.ru.md)
- [Serbe / Srpski](/i18n/README.sr.md)
- [Sinhala / සිංහල](/i18n/README.si.md)
- [Spanish / Español](/i18n/README.es.md)
- [Chinois simplifié / 简体中文](/i18n/README.zh-cn.md)
- [Suédois / Svenska](/i18n/README.sv.md)
- [Thai / ไทย](/i18n/README.th.md)
- [Chinois traditionnel / 繁體中文](/i18n/README.zh-tw.md)
- [Turc / Türkçe](/i18n/README.tr.md)
- [Ukrainien / Українська](/i18n/README.uk.md)
- [Vietnamien / Tiếng Việt](/i18n/README.vi-vn.md)
- [Liste des traductions](/i18n/languages.md) <!--- Keep only this -->

---

## Commanditaires

[ ![Nouveau sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
