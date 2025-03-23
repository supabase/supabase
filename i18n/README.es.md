<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) es una alternativa de código abierto a Firebase. Estamos construyendo las funcionalidades de Firebase utilizando herramientas de código abierto de nivel empresarial.

**Características principales:**

- [x] **Base de datos Postgres administrada:** [Documentación](https://supabase.com/docs/guides/database)
- [x] **Autenticación y autorización:** [Documentación](https://supabase.com/docs/guides/auth)
- [x] **API generadas automáticamente:**
    - [x] REST: [Documentación](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Documentación](https://supabase.com/docs/guides/graphql)
    - [x] Suscripciones en tiempo real: [Documentación](https://supabase.com/docs/guides/realtime)
- [x] **Funciones:**
    - [x] Funciones de base de datos: [Documentación](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (funciones en el borde de la red): [Documentación](https://supabase.com/docs/guides/functions)
- [x] **Almacenamiento de archivos:** [Documentación](https://supabase.com/docs/guides/storage)
- [x] **Herramientas de IA, vectores e incrustaciones (embeddings):** [Documentación](https://supabase.com/docs/guides/ai)
- [x] **Panel de control**

![Panel de control de Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Suscríbete a "releases" de este repositorio para recibir notificaciones sobre actualizaciones importantes. Esto te permitirá estar al día de las últimas modificaciones y mejoras.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Seguir el repositorio"/></kbd>

## Documentación

La documentación completa está disponible en [supabase.com/docs](https://supabase.com/docs). Allí encontrarás todas las guías y materiales de referencia necesarios.

Si quieres contribuir al desarrollo del proyecto, consulta la sección [Primeros pasos](./../DEVELOPERS.md).

## Comunidad y soporte

*   **Foro de la comunidad:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Ideal para obtener ayuda con el desarrollo y discutir las mejores prácticas para trabajar con bases de datos.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Utilízalo para informar de errores y problemas que encuentres al usar Supabase.
*   **Soporte por correo electrónico:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). La mejor opción para resolver problemas con tu base de datos o infraestructura.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Un gran lugar para compartir tus aplicaciones y comunicarte con la comunidad.

## Principio de funcionamiento

Supabase combina varias herramientas de código abierto. Construimos funcionalidades similares a Firebase utilizando productos probados de nivel empresarial. Si una herramienta o comunidad existe y tiene una licencia MIT, Apache 2 o una licencia abierta similar, utilizaremos y apoyaremos esa herramienta. Si no existe tal herramienta, la crearemos nosotros mismos y abriremos su código fuente. Supabase no es una réplica exacta de Firebase. Nuestro objetivo es proporcionar a los desarrolladores una comodidad comparable a Firebase, pero utilizando herramientas de código abierto.

**Arquitectura**

Supabase es una [plataforma administrada](https://supabase.com/dashboard). Puedes registrarte y comenzar a usar Supabase de inmediato, sin instalar nada. También puedes [desplegar tu propia infraestructura](https://supabase.com/docs/guides/hosting/overview) y [desarrollar localmente](https://supabase.com/docs/guides/local-development).

![Arquitectura](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Un sistema de gestión de bases de datos relacional de objetos con más de 30 años de historia de desarrollo activo. Es conocido por su fiabilidad, funcionalidad y rendimiento.
*   **Realtime:** Un servidor Elixir que te permite escuchar los cambios en PostgreSQL (inserciones, actualizaciones y eliminaciones) a través de websockets. Realtime utiliza la funcionalidad de replicación integrada de Postgres, convierte los cambios a JSON y los transmite a los clientes autorizados.
*   **PostgREST:** Un servidor web que convierte tu base de datos PostgreSQL en una API RESTful.
*   **GoTrue:** Una API basada en JWT para administrar usuarios y emitir tokens JWT.
*   **Storage:** Proporciona una interfaz RESTful para administrar archivos almacenados en S3, utilizando Postgres para administrar los permisos.
*   **pg_graphql:** Una extensión de PostgreSQL que proporciona una API GraphQL.
*   **postgres-meta:** Una API RESTful para administrar tu Postgres, que te permite obtener tablas, agregar roles, ejecutar consultas, etc.
*   **Kong:** Una puerta de enlace de API nativa de la nube.

#### Bibliotecas de cliente

Utilizamos un enfoque modular para las bibliotecas de cliente. Cada sub-biblioteca está diseñada para trabajar con un único sistema externo. Esta es una de las formas de apoyar las herramientas existentes.

(Tabla con bibliotecas de cliente, como en el original, pero con nombres en español y explicaciones, donde sea necesario).

| Lenguaje                       | Cliente Supabase                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Oficiales⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Mantenidas por la comunidad💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Insignias (Badges)

Puedes utilizar estas insignias para mostrar que tu aplicación está creada con Supabase:

**Claro:**

![Hecho con Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Hecho con Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Hecho con Supabase" />
</a>
```

**Oscuro:**

![Hecho con Supabase (versión oscura)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Hecho con Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Hecho con Supabase" />
</a>
```

## Traducciones

[Lista de traducciones](./languages.md)
