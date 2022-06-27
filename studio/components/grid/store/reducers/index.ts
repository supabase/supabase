import BaseReducer, { BaseInitialState, baseInitialState } from './base'
import CallbackReducer, { CallbackInitialState, callbackInitialState } from './callback'
import ColumnReducer, { ColumnInitialState, columnInitialState } from './column'
import RowReducer, { RowInitialState, rowInitialState } from './row'
import SortReducer, { SortInitialState, sortInitialState } from './sort'

export interface InitialStateType
  extends BaseInitialState,
    CallbackInitialState,
    ColumnInitialState,
    RowInitialState,
    SortInitialState {}

export const initialState = {
  ...baseInitialState,
  ...callbackInitialState,
  ...columnInitialState,
  ...rowInitialState,
  ...sortInitialState,
}

export { BaseReducer, CallbackReducer, ColumnReducer, RowReducer, SortReducer }
