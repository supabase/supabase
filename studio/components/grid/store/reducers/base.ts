import { CalculatedColumn } from '@supabase/react-data-grid';
import { GridProps, SavedState, SupaTable } from '../../types';
import { REFRESH_PAGE_IMMEDIATELY } from '../../constants';
import { IRowService, SqlRowService } from '../../services/row';
import { IMetaService, SqlMetaService } from '../../services/meta';

export interface BaseInitialState {
  table: SupaTable | null;
  metaService: IMetaService | null;
  rowService: IRowService | null;
  refreshPageFlag: number;
  isInitialComplete: boolean;
  editable: boolean;
}

export const baseInitialState: BaseInitialState = {
  table: null,
  metaService: null,
  rowService: null,
  refreshPageFlag: 0,
  isInitialComplete: false,
  editable: false,
};

export type INIT_ACTIONTYPE =
  | {
      type: 'INIT_CLIENT';
      payload: {
        onSqlQuery: (query: string) => Promise<{ data?: any; error?: any }>;
      };
    }
  | {
      type: 'INIT_TABLE';
      payload: {
        table: SupaTable;
        gridColumns: CalculatedColumn<any, any>[];
        gridProps?: GridProps;
        savedState?: SavedState;
        editable?: boolean;
        onSqlQuery: (query: string) => Promise<{ data?: any; error?: any }>;
        onError: (error: any) => void;
      };
    };

type BASE_ACTIONTYPE = INIT_ACTIONTYPE;

const BaseReducer = (state: BaseInitialState, action: BASE_ACTIONTYPE) => {
  switch (action.type) {
    case 'INIT_CLIENT': {
      return {
        ...state,
        metaService: new SqlMetaService(action.payload.onSqlQuery),
      };
    }
    case 'INIT_TABLE': {
      return {
        ...state,
        table: action.payload.table,
        rowService: new SqlRowService(
          action.payload.table,
          action.payload.onSqlQuery,
          action.payload.onError
        ),
        refreshPageFlag: REFRESH_PAGE_IMMEDIATELY,
        isInitialComplete: true,
        editable: action.payload.editable || false,
      };
    }
    default:
      return state;
  }
};

export default BaseReducer;
