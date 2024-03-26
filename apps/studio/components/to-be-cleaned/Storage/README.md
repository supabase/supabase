## What to clean for Storage

- Convert files from javascript to typescript
- Not use mobx store for UI related states, these could simply be done via react's useState or useReducer
  - Involves some heavy surgery nonetheless as 90% of the explorer logic is written a mobx store StorageExplorerStore
  - If anyone is able to get to it before I do, please feel free to take this on and perhaps even write it more simply 🙏
