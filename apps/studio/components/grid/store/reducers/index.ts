import BaseReducer, { type BaseInitialState, baseInitialState } from './base'
import CallbackReducer, { type CallbackInitialState, callbackInitialState } from './callback'
import ColumnReducer, { type ColumnInitialState, columnInitialState } from './column'

export interface InitialStateType
  extends BaseInitialState,
    CallbackInitialState,
    ColumnInitialState {}

export const initialState = {
  ...baseInitialState,
  ...callbackInitialState,
  ...columnInitialState,
}

export { BaseReducer, CallbackReducer, ColumnReducer }
