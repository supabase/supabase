import { createStore } from '@stencil/store';

const store = createStore({
  user: undefined,
  isAuthenticated: false,
  appInitError: '',
  appInit: false,
  registerLoader: false,
  loginLoader: false,
});

store.onChange('isAuthenticated', value => {
  AppState.isAuthenticated = value;
});
store.onChange('user', value => {
  AppState.user = value;
});
store.onChange('appInitError', value => {
  AppState.appInitError = value;
});
store.onChange('appInit', value => {
  AppState.appInit = value;
});

export const AppState = store.state;
export const getStateProp = store.get;
export const setStateProp = store.set;
export const resetAppState = store.reset;
