## Project structure 🗄️

### Service

This class will handle application authenticate features to supabase.

```
src -> services -> auth.service.ts -> Class SupabaseAuthService
```

You can create more classes to group a functionality.

### Store

Application store

```
src -> store -> app.store.ts
```

### Interfaces

Interfaces used in the application

```
src -> interface -> interface.ts
```

### Utility

Utility for parsing application messages and holding form configurations

```
src -> util -> util.ts
```

### Configuration

Application level configurations

```
src -> config -> config.ts
```

### Assets

Application level assets

```
src -> assets
```

### Components

Application level components

```
src -> components ->
1. <app-flash-message> for showing alert messages
2. <app-home> Dashboard
3. <app-root> entry component of the application
5. <page> for showing pages
6. <auth> -> having login/register components
```

### Styling 💀

I have used `scss` for styling components. Ths boilerplate have a basic design i.e it focus more on configuring and using supabase in stencil web app along with stencil store. You can customize the looks as per your needs.
