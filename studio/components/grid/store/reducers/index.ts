import BaseReducer, { BaseInitialState, baseInitialState } from './base'
import CallbackReducer, { CallbackInitialState, callbackInitialState } from './callback'
import ColumnReducer, { ColumnInitialState, columnInitialState } from './column'
import RowReducer, { RowInitialState, rowInitialState } from './row'

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
