import BaseReducer, { type BaseInitialState, baseInitialState } from './base'
import CallbackReducer, { type CallbackInitialState, callbackInitialState } from './callback'
import ColumnReducer, { type ColumnInitialState, columnInitialState } from './column'
import RowReducer, { type RowInitialState, rowInitialState } from './row'

export interface InitialStateType
  extends BaseInitialState,
    CallbackInitialState,
    ColumnInitialState,
    RowInitialState {}

export const initialState = {
  ...baseInitialState,
  ...callbackInitialState,
  ...columnInitialState,
  ...rowInitialState,
}

export { BaseReducer, CallbackReducer, ColumnReducer, RowReducer }
