<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--light.svg#gh-light-mode-only">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/packages/common/assets/images/supabase-logo-wordmark--dark.svg#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) es una alternativa de código abierto a Firebase. Estamos construyendo las funcionalidades de Firebase usando herramientas de código abierto de nivel empresarial.

- [x] Alojamiento de base de datos Postgres
- [x] Autenticación y autorización
- [x] API autogenerada
  - [x] REST
  - [x] Suscripciones en tiempo real
  - [x] GraphQL (Beta)
- [x] Funciones
  - [x] Funciones de Bases de Datos
  - [x] Edge Functions
- [x] Almacenamiento
- [x] Panel de control

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## Documentación

Para ver la documentación completa, visita [supabase.com/docs](https://supabase.com/docs).

Para ver como contribuir, visita los [Primeros Pasos](../DEVELOPERS.md)

## Comunidad y soporte

- [Foro de la comunidad](https://github.com/supabase/supabase/discussions). Mejor para: ayuda construyendo, discusiones acerca de las mejores practicas de base de datos.
- [GitHub Issues](https://github.com/supabase/supabase/issues). Mejor para: bugs y errores que te puedes encontrar utilizando Supabase.
- [Soporte por e-mail](https://supabase.com/docs/support#business-support). Mejor para: problemas con la base de datos o infraestructura.
- [Discord](https://discord.supabase.com). Mejor para: compartir tus aplicaciones y pasar el rato con la comunidad.

## Estatus

- [x] Alfa: Estamos probando Supabase con un círculo cerrado de clientes.
- [x] Alfa pública: Cualquiera puede registrarse en [app.supabase.com](https://app.supabase.com). Pero sé flexible con nosotros, aún pueden existir obstáculos.
- [x] Beta pública: Suficientemente estable para la mayoría de los casos no empresariales.
- [ ] Público: Listo para producción.

Actualmente estamos en la fase de beta pública. Puedes suscribirte a las _releases_ de este repositorio para mantenerte notificado de actualizaciones mayores.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Seguir este repositorio"/></kbd>

---

## Cómo funciona

Supabase es una combinación de herramientas de código abierto. Estamos construyendo las funcionalidades de Firebase utilizando soluciones de código abierto de nivel empresarial. Si las herramientas y comunidades existen con una licencia abierta MIT, Apache 2 o equivalente, usaremos y apoyaremos tal herramienta. Si la herramienta no existe, la desarrollaremos y la lanzaremos como herramienta de código abierto nosotros mismos. Supabase no es un mapeo _1 a 1_ de Firebase. Nuestro objetivo es dar a los desarrolladores una experiencia parecida a la de Firebase utilizando herramientas de código abierto.

**Arquitectura actual**

Supabase es una [plataforma alojada](https://app.supabase.com). Te puedes registrar y comenzar a utilizar Supabase sin instalar nada. También puedes tener un [_host_ propio](https://supabase.com/docs/guides/hosting/overview) y [desarrollar en local](https://supabase.com/docs/guides/local-development).

![Arquitectura](https://user-images.githubusercontent.com/70828596/187547862-ffa9d058-0c3a-4851-a3e7-92ccfca4b596.png)

- [PostgreSQL](https://www.postgresql.org/) es un sistema de base de datos objeto-relacional con más de 30 años de desarrollo activo que se ha ganado su fuerte reputación por ser confiable, robusto y de alto rendimiento.
- [Tiempo Real](https://github.com/supabase/realtime) es un server construido en Elixir que permite escuchar a los _inserts_, _updates_ y _deletes_ de PostgreSQL utilizando WebSockets. Supabase escucha a la funcionalidad de replicación integrada de PostgreSQL, convierte el byte de replicación en un JSON y después transmite el JSON a través de WebSockets.
- [PostgREST](http://postgrest.org/) es un servidor web que convierte la base de datos PostgreSQL directamente en una API RESTful.
- [Almacenamiento](https://github.com/supabase/storage-api) proporciona una interfaz RESTful para manipular los archivos alojados en S3, utilizando Postgres para manejar los permisos.
- [postgres-meta](https://github.com/supabase/postgres-meta) es una API RESTful para manejar Postgres, permite obtener información de tablas, agregar roles, ejecutar consultas, etc.
- [GoTrue](https://github.com/netlify/gotrue) es una API basada en SWT para administrar usuarios y distribuir tokens SWT.
- [Kong](https://github.com/Kong/kong) es un API gateway nativo alojado en la nube.

#### Librerías de cliente

Nuestra librería de cliente es modular. Cada sub-librería es una implementación independiente para cada sistema externo. Esta es una de las formas de apoyar las herramientas existentes.

<table style="table-layout:fixed; white-space: nowrap;">
  <tr>
    <th>Lenguaje</th>
    <th>Cliente</th>
    <th colspan="5">Característica - Clientes (incluido en el cliente de Supabase)</th>
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
    <td><a href="https://github.com/supabase-community/storage-java" target="_blanke" rel="noopener noreferrer">storage-java</a></td>
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

<!--- Remove this list if you're traslating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## Traducciones

- [Lista de traducciones](/i18n/languages.md) <!--- Keep only the this-->

---

## Patrocinadores

[![Nuevo patrocinador](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
