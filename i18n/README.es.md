<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) es una alternativa de código abierto a Firebase. Estamos construyendo las características de Firebase utilizando herramientas de código abierto de nivel empresarial.

- [x] Base de datos Postgres alojada. [Documentación](https://supabase.com/docs/guides/database)
- [x] Autenticación y autorización. [Documentos](https://supabase.com/docs/guides/auth)
- [x] API autogeneradas.
  - [x] REST. [Docs](https://supabase.com/docs/guides/api#rest-api-overview)
  - [x] GraphQL. [Documentos](https://supabase.com/docs/guides/api#graphql-api-overview)
  - [x] Suscripciones en tiempo real. [Documentos](https://supabase.com/docs/guides/api#realtime-api-overview)
- [x] Funciones.
  - [x] Funciones de base de datos. [Docs](https://supabase.com/docs/guides/database/functions)
  - [x] Funciones de borde [Docs](https://supabase.com/docs/guides/functions)
- [x] Almacenamiento de archivos. [Documentos](https://supabase.com/docs/guides/storage)
- [x] Panel de control

[Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## Documentación

Para consultar la documentación completa, visite [supabase.com/docs](https://supabase.com/docs)

Para ver cómo contribuir, visite [Getting Started](../DEVELOPERS.md)

## Comunidad y soporte

- [Foro de la comunidad](https://github.com/supabase/supabase/discussions). Lo mejor para: ayuda con la construcción, discusión sobre las mejores prácticas de bases de datos.
- [Problemas en GitHub](https://github.com/supabase/supabase/issues). Lo mejor para: bugs y errores que encuentres usando Supabase.
- [Soporte por correo electrónico](https://supabase.com/docs/support#business-support). Lo mejor para: problemas con tu base de datos o infraestructura.
- [Discord](https://discord.supabase.com). Lo mejor para: compartir tus aplicaciones y pasar el rato con la comunidad.

## Estado

- [x] Alfa: Estamos probando Supabase con un grupo cerrado de clientes
- [x] Alfa público: Cualquiera puede registrarse en [supabase.com/dashboard](https://supabase.com/dashboard). Pero no te pases, hay algunos problemas
- [Beta pública: Suficientemente estable para la mayoría de los casos de uso no empresariales
- [Público: Disponibilidad general [[status](https://supabase.com/docs/guides/getting-started/features#feature-status)]

Actualmente estamos en Beta Pública. Esté atento a "releases" de este repositorio para recibir notificaciones de actualizaciones importantes.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Cómo funciona

Supabase es una combinación de herramientas de código abierto. Estamos construyendo las características de Firebase utilizando productos de código abierto de nivel empresarial. Si las herramientas y las comunidades existen, con una licencia abierta MIT, Apache 2 o equivalente, utilizaremos y daremos soporte a esa herramienta. Si la herramienta no existe, la construimos y la desarrollamos nosotros mismos. Supabase no es un mapeo 1 a 1 de Firebase. Nuestro objetivo es ofrecer a los desarrolladores una experiencia similar a la de Firebase utilizando herramientas de código abierto.

**Arquitectura**

Supabase es una [plataforma alojada](https://supabase.com/dashboard). Puedes registrarte y empezar a usar Supabase sin instalar nada.
También puede [autoalojarse](https://supabase.com/docs/guides/hosting/overview) y [desarrollar localmente](https://supabase.com/docs/guides/local-development).

![arquitectura](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.svg)

- [PostgreSQL](https://www.postgresql.org/) es un sistema de base de datos objeto-relacional con más de 30 años de desarrollo activo que le ha valido una sólida reputación por su fiabilidad, robustez de características y rendimiento.
- [Realtime](https://github.com/supabase/realtime) es un servidor Elixir que te permite escuchar las inserciones, actualizaciones y eliminaciones de PostgreSQL utilizando websockets. Realtime sondea la funcionalidad de replicación integrada de Postgres en busca de cambios en la base de datos, convierte los cambios a JSON y, a continuación, transmite el JSON a través de websockets a los clientes autorizados.
- [PostgREST](http://postgrest.org/) es un servidor web que convierte su base de datos PostgreSQL directamente en una API RESTful
- [pg_graphql](http://github.com/supabase/pg_graphql/) una extensión de PostgreSQL que expone una API GraphQL
- [Storage](https://github.com/supabase/storage-api) proporciona una interfaz RESTful para gestionar archivos almacenados en S3, usando Postgres para gestionar permisos.
- [postgres-meta](https://github.com/supabase/postgres-meta) es una API RESTful para gestionar tu Postgres, permitiéndote obtener tablas, añadir roles, ejecutar consultas, etc.
- [GoTrue](https://github.com/netlify/gotrue) es una API basada en SWT para gestionar usuarios y emitir tokens SWT.
- [Kong](https://github.com/Kong/kong) es una pasarela API nativa en la nube.

#### Bibliotecas de cliente

Nuestro enfoque para las bibliotecas cliente es modular. Cada sublibrería es una implementación independiente para un único sistema externo. Esta es una de las formas en que apoyamos las herramientas existentes.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Idioma</th>
    <th>Cliente</th>
    <th colspan="5">Feature-Clients (incluido en el cliente Supabase)</th>
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
  
  <th colspan="7">⚡️ Official ⚡️</th>
  
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
  
  <th colspan="7">💚 Comunidad 💚</th>
  
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

## Traducciones

- [Árabe | العربية](/i18n/README.ar.md)
- [albanés / shqip](/i18n/README.sq.md)
- [Bangla / বাংলা](/i18n/README.bn.md)
- [Búlgaro / Български](/i18n/README.bg.md)
- [Catalán / Català](/i18n/README.ca.md)
- [Danés / Dansk](/i18n/README.da.md)
- [Holandés / Nederlands](/i18n/README.nl.md)
- [Inglés](https://github.com/supabase/supabase)
- [Finlandés / Suomalainen](/i18n/README.fi.md)
- [Francés / Français](/i18n/README.fr.md)
- [Alemán / Deutsch](/i18n/README.de.md)
- [Griego / Ελληνικά](/i18n/README.gr.md)
- [Hebreo / עברית](/i18n/README.he.md)
- [Hindi / हिंदी](/i18n/README.hi.md)
- [Húngaro / Magyar](/i18n/README.hu.md)
- [Nepalí / नेपाली](/i18n/README.ne.md)
- [Indonesio / Bahasa Indonesia](/i18n/README.id.md)
- [Italiano / Italiano](/i18n/README.it.md)
- [Japonés / 日本語](/i18n/README.jp.md)
- [Coreano / 한국어](/i18n/README.ko.md)
- [Malayo / Bahasa Malaysia](/i18n/README.ms.md)
- [Noruego (Bokmål) / Norsk (Bokmål)](/i18n/README.nb-no.md)
- [Persa / فارسی](/i18n/README.fa.md)
- [Polaco / Polski](/i18n/README.pl.md)
- [Portugués / Português](/i18n/README.pt.md)
- [Portugués (brasileño) / Português Brasileiro](/i18n/README.pt-br.md)
- [Rumano / Română](/i18n/README.ro.md)
- [Ruso / Pусский](/i18n/README.ru.md)
- [Serbio / Srpski](/i18n/README.sr.md)
- [Sinhala / සිංහල](/i18n/README.si.md)
- [Español / English](/i18n/README.es.md)
- [Chino simplificado / 简体中文](/i18n/README.zh-cn.md)
- [Sueco / Svenska](/i18n/README.sv.md)
- [Tailandés / ไทย](/i18n/README.th.md)
- [Chino tradicional / 繁體中文](/i18n/README.zh-tw.md)
- [Turco / Türkçe](/i18n/README.tr.md)
- [Ucraniano / Українська](/i18n/README.uk.md)
- [Vietnamita / Tiếng Việt](/i18n/README.vi-vn.md)
- [Lista de traducciones](/i18n/languages.md) <!--- Keep only this -->

---

## Patrocinadores

[![Nuevo Patrocinador](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
