import update from 'immutability-helper';
import { Sort } from '../../types';
import { getInitialSorts } from '../../utils';
import { INIT_ACTIONTYPE } from './base';

export interface SortInitialState {
  sorts: Sort[];
}

export const sortInitialState: SortInitialState = { sorts: [] };

type SORT_ACTIONTYPE =
  | INIT_ACTIONTYPE
  | {
      type: 'SET_SORTS';
      payload: Sort[];
    }
  | { type: 'ADD_SORT'; payload: Sort }
  | { type: 'REMOVE_SORT'; payload: { column: string } }
  | {
      type: 'UPDATE_SORT';
      payload: Sort;
    }
  | {
      type: 'MOVE_SORT';
      payload: { fromIndex: number; toIndex: number };
    };

const SortReducer = (state: SortInitialState, action: SORT_ACTIONTYPE) => {
  switch (action.type) {
    case 'INIT_TABLE': {
      return {
        ...state,
        sorts: getInitialSorts(action.payload.table, action.payload.savedState),
      };
    }
    case 'SET_SORTS':
      return {
        ...state,
        sorts: action.payload,
      };
    case 'ADD_SORT':
      return {
        ...state,
        sorts: update(state.sorts, { $push: [action.payload] }),
        refreshPageFlag: Date.now(),
      };
    case 'REMOVE_SORT':
      return {
        ...state,
        sorts: state.sorts.filter((x) => x.column !== action.payload.column),
        refreshPageFlag: Date.now(),
      };
    case 'UPDATE_SORT':
      return {
        ...state,
        sorts: state.sorts.map((x) => {
          if (x.column == action.payload.column) return action.payload;
          return x;
        }),
        refreshPageFlag: Date.now(),
      };
    case 'MOVE_SORT': {
      const moveItem = state.sorts[action.payload.fromIndex];
      return {
        ...state,
        sorts: update(state.sorts, {
          $splice: [
            [action.payload.fromIndex, 1],
            [action.payload.toIndex, 0, moveItem],
          ],
        }),
        refreshPageFlag: Date.now(),
      };
    }
    default:
      return state;
  }
};

export default SortReducer;
