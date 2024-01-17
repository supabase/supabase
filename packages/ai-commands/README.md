# ai-commands

## Main purpose

This package contains all features involving AI and LLMs (eg. via OpenAI API).
Each feature is implemented as a function which can be easily tested for regressions.

The streaming functions only work on Edge runtime so they can only be imported via a special `edge` subpath like so:

```ts
import { chatRlsPolicy } from 'ai-commands/edge'
```
