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

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Seguir este repositorio"/></kbd>

---

## Cómo funciona

Supabase es una combinación de herramientas de código abierto. Estamos construyendo las funcionalidades de Firebase utilizando soluciones de código abierto de nivel empresarial. Si las herramientas y comunidades existen con una licencia abierta MIT, Apache 2 o equivalente, usaremos y apoyaremos tal herramienta. Si la herramienta no existe, la desarrollaremos y la lanzaremos como herramienta de código abierto nosotros mismos. Supabase no es un mapeo _1 a 1_ de Firebase. Nuestro objetivo es dar a los desarrolladores una experiencia parecida a la de Firebase utilizando herramientas de código abierto.

**Arquitectura actual**

Supabase es una [plataforma alojada](https://app.supabase.com). Te puedes registrar y comenzar a utilizar Supabase sin instalar nada. También puedes tener un [_host_ propio](https://supabase.com/docs/guides/hosting/overview) y [desarrollar en local](https://supabase.com/docs/guides/local-development).

![Arquitectura](https://supabase.com/docs/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/) es un sistema de base de datos objeto-relacional con más de 30 años de desarrollo activo que se ha ganado su fuerte reputación por ser confiable, robusto y de alto rendimiento.
- [Tiempo Real](https://github.com/supabase/realtime) es un server construido en Elixir que permite escuchar a los _inserts_, _updates_ y _deletes_ de PostgreSQL utilizando WebSockets. Supabase escucha a la funcionalidad de replicación integrada de PostgreSQL, convierte el byte de replicación en un JSON y después transmite el JSON a través de WebSockets.
- [PostgREST](http://postgrest.org/) es un servidor web que convierte la base de datos PostgreSQL directamente en una API RESTful.
- [Almacenamiento](https://github.com/supabase/storage-api) proporciona una interfaz RESTful para manipular los archivos alojados en S3, utilizando Postgres para manejar los permisos.
- [postgres-meta](https://github.com/supabase/postgres-meta) es una API RESTful para manejar Postgres, permite obtener información de tablas, agregar roles, ejecutar consultas, etc.
- [GoTrue](https://github.com/netlify/gotrue) es una API basada en SWT para administrar usuarios y distribuir tokens SWT.
- [Kong](https://github.com/Kong/kong) es un API gateway nativo alojado en la nube.

#### Librerías de cliente

Nuestra librería de cliente es modular. Cada sub-librería es una implementación independiente para cada sistema externo. Esta es una de las formas de apoyar las herramientas existentes.

- **`supabase-{lang}`**: Combina librerías y agrega mejoras.
  - `postgrest-{lang}`: Librería de cliente para trabajar con [PostgREST](https://github.com/postgrest/postgrest)
  - `realtime-{lang}`: Librería de cliente para trabajar con [Realtime](https://github.com/supabase/realtime)
  - `gotrue-{lang}`: Librería de cliente para trabajar con [GoTrue](https://github.com/netlify/gotrue)

| Repositorio           | Oficial                                          | Comunidad                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust`                                                |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust`                                                |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust`                                                      |

<!--- Remove this list if you're traslating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## Traducciones

- [Lista de traducciones](/i18n/languages.md) <!--- Keep only the this-->

---

## Patrocinadores

[![Nuevo patrocinador](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
