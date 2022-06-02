import BaseReducer, { BaseInitialState, baseInitialState } from './base';
import CallbackReducer, {
  CallbackInitialState,
  callbackInitialState,
} from './callback';
import ColumnReducer, {
  ColumnInitialState,
  columnInitialState,
} from './column';
import RowReducer, { RowInitialState, rowInitialState } from './row';
import SortReducer, { SortInitialState, sortInitialState } from './sort';
import FilterReducer, {
  FilterInitialState,
  filterInitialState,
} from './filter';

export interface InitialStateType
  extends BaseInitialState,
    CallbackInitialState,
    ColumnInitialState,
    FilterInitialState,
    RowInitialState,
    SortInitialState {}

export const initialState = {
  ...baseInitialState,
  ...callbackInitialState,
  ...columnInitialState,
  ...filterInitialState,
  ...rowInitialState,
  ...sortInitialState,
};

export {
  BaseReducer,
  CallbackReducer,
  ColumnReducer,
  FilterReducer,
  RowReducer,
  SortReducer,
};
