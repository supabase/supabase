<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

# Supabase

[Supabase](https://supabase.com) 是 Postgres 开发平台。我们正在使用企业级开源工具构建 Firebase 的功能。

- [x] 托管 Postgres 数据库。[文档](https://supabase.com/docs/guides/database)
- [x] 认证和授权。[文档](https://supabase.com/docs/guides/auth)
- [x] 自动生成的 API。
  - [x] REST。[文档](https://supabase.com/docs/guides/api)
  - [x] GraphQL。[文档](https://supabase.com/docs/guides/graphql)
  - [x] 实时订阅。[文档](https://supabase.com/docs/guides/realtime)
- [x] 函数。
  - [x] 数据库函数。[文档](https://supabase.com/docs/guides/database/functions)
  - [x] Edge Functions。[文档](https://supabase.com/docs/guides/functions)
- [x] 文件存储。[文档](https://supabase.com/docs/guides/storage)
- [x] AI 与向量/嵌入工具包。[文档](https://supabase.com/docs/guides/ai)
- [x] Deno 运行时中安全的服务器端函数。[文档](https://supabase.com/docs/guides/functions)

## 文档

完整文档请访问 [supabase.com/docs](https://supabase.com/docs)

想贡献？请访问 [supabase.com/docs/contributing](https://supabase.com/docs/contributing) 开始

## 社区与支持

- [社区论坛](https://github.com/supabase/supabase/discussions)。适合：构建帮助、讨论最佳实践。
- [GitHub Issues](https://github.com/supabase/supabase/issues)。适合：Supabase 使用中的 bug 和错误。
- [电子邮件支持](https://supabase.com/docs/support)。适合：数据库和基础设施问题。
- [Discord](https://discord.supabase.com)。适合：与社区成员分享应用和闲聊。

## 快速开始

访问 [database.new](https://database.new) 创建新的 Supabase 项目。

### 使用 JS

```bash
npm i @supabase/supabase-js
```

```js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://your-project.supabase.co', 'your-anon-key')
```

### 使用 Dart/Flutter

```bash
dart pub add supabase_flutter
```

```dart
void main() async {
  Supabase.initialize(url: 'https://your-project.supabase.co', anonKey: 'your-anon-key');
}
```

### 使用 Python

```bash
pip install supabase
```

```python
from supabase import create_client, Client

url: str = "https://your-project.supabase.co"
key: str = "your-anon-key"
supabase: Client = create_client(url, key)
```

### 使用 Kotlin

```kotlin
val supabase = createSupabaseClient(
    supabaseUrl = "https://your-project.supabase.co",
    supabaseKey = "your-anon-key"
) {
    install(Auth)
    install(Postgrest)
}
```

### 使用 Swift

```swift
let supabase = SupabaseClient(
  supabaseURL: URL(string: "https://your-project.supabase.co")!,
  supabaseKey: "your-anon-key"
)
```

## 使用 Next.js 构建

使用我们的快速入门指南在几分钟内开始使用 Supabase 和 Next.js。

[![使用 Next.js 构建](https://raw.githubusercontent.com/supabase/supabase/refs/heads/master/apps/docs/public/img/build-with-nextjs.png)](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

## 使用 Remix 构建

使用我们的快速入门指南在几分钟内开始使用 Supabase 和 Remix。

[![使用 Remix 构建](https://raw.githubusercontent.com/supabase/supabase/refs/heads/master/apps/docs/public/img/build-with-remix.png)](https://supabase.com/docs/guides/getting-started/quickstarts/remix)

## 使用 React 构建

使用我们的快速入门指南在几分钟内开始使用 Supabase 和 React。

[![使用 React 构建](https://raw.githubusercontent.com/supabase/supabase/refs/heads/master/apps/docs/public/img/build-with-react.png)](https://supabase.com/docs/guides/getting-started/quickstarts/react)

## 使用 Vue 构建

使用我们的快速入门指南在几分钟内开始使用 Supabase 和 Vue。

[![使用 Vue 构建](https://raw.githubusercontent.com/supabase/supabase/refs/heads/master/apps/docs/public/img/build-with-vue.png)](https://supabase.com/docs/guides/getting-started/quickstarts/vue)

## 使用 Nuxt 构建

使用我们的快速入门指南在几分钟内开始使用 Supabase 和 Nuxt。

[![使用 Nuxt 构建](https://raw.githubusercontent.com/supabase/supabase/refs/heads/master/apps/docs/public/img/build-with-nuxt.png)](https://supabase.com/docs/guides/getting-started/quickstarts/nuxt)

## 身份验证

Supabase 支持多种身份验证方式：

- 电子邮件/密码
- 魔法链接
- OAuth 提供商（Google、GitHub、GitLab 等）
- 电话号码
- SSO/SAML

[了解更多](https://supabase.com/docs/guides/auth)

## 行为准则

我们采用了 Supabase 应该为所有人提供欢迎和安全体验的行为准则。请阅读 [完整的行为准则](https://github.com/supabase/.github/blob/main/CODE_OF_CONDUCT.md)。

## 贡献

想贡献？请查看 [贡献指南](https://supabase.com/docs/contributing)。

## 许可证

本仓库使用 Apache 2.0 许可证。主要库使用不同的许可证，请参见各自的 LICENSE 文件。

- `apps/` 目录下的文件使用 [Apache License](LICENSE)
- `packages/` 目录下的所有包（`supabase-js` 除外）使用 [Apache License](LICENSE)
- `supabase-js` 使用 [MIT License](https://github.com/supabase/supabase-js/blob/main/LICENSE)
- `supabase-flutter` 使用 [Apache License](https://github.com/supabase/supabase-flutter/blob/main/LICENSE)
- `supabase-py` 使用 [Apache License](https://github.com/supabase/supabase-py/blob/main/LICENSE)
