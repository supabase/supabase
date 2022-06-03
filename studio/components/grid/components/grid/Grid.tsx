import * as React from 'react';
import { memo } from 'react-tracked';
import DataGrid, {
  DataGridHandle,
  RowsChangeData,
} from '@supabase/react-data-grid';
import { IconLoader } from '@supabase/ui';
import { GridProps, SupaRow } from '../../types';
import { useDispatch, useTrackedState } from '../../store';
import RowRenderer from './RowRenderer';
import AwesomeDebouncePromise from 'awesome-debounce-promise';

function rowKeyGetter(row: SupaRow) {
  return row.idx;
}

export const Grid = memo(
  React.forwardRef<DataGridHandle, GridProps>(
    (
      { width, height, containerClass, gridClass, rowClass },
      ref: React.Ref<DataGridHandle> | undefined
    ) => {
      const dispatch = useDispatch();
      const state = useTrackedState();
      // workaround to force state tracking on state.gridColumns
      const columnHeaders = state.gridColumns.map(
        (x) => `${x.key}_${x.frozen}`
      );
      const { gridColumns, rows, onError: onErrorFunc } = state;

      function onColumnResize(index: number, width: number) {
        updateColumnResizeDebounced(index, width, dispatch);
      }

      function onRowsChange(
        rows: SupaRow[],
        data: RowsChangeData<SupaRow, unknown>
      ) {
        const rowData = rows[data.indexes[0]];
        const originRowData = state.rows.find((x) => x.idx == rowData.idx);
        const changedColumn = Object.keys(rowData).find((name) => rowData[name] !== originRowData![name]);
        if (changedColumn) {
          const { error } = state.rowService!.update(rowData, changedColumn);
          if (error) {
            if (onErrorFunc) onErrorFunc(error);
          } else {
            dispatch({
              type: 'SET_ROWS',
              payload: { rows },
            });
          }
        }
      }

      function onSelectedRowsChange(selectedRows: ReadonlySet<number>) {
        dispatch({
          type: 'SELECTED_ROWS_CHANGE',
          payload: { selectedRows },
        });
      }

      function onSelectedCellChange(position: { idx: number; rowIdx: number }) {
        dispatch({
          type: 'SELECTED_CELL_CHANGE',
          payload: { position },
        });
      }

      if (!columnHeaders || columnHeaders.length == 0) {
        return (
          <div
            className="sb-grid-grid--loading"
            style={{ width: width || '100%', height: height || '50vh' }}
          >
            <div className="sb-grid-grid--loading__inner flex items-center gap-2">
              <div className="animate-spin text-scale-900">
                <IconLoader />
              </div>
              <div className="text-sm text-scale-1100">Loading...</div>
            </div>
          </div>
        );
      }
      return (
        <div
          className={containerClass}
          style={{ width: width || '100%', height: height || '50vh' }}
        >
          <DataGrid
            ref={ref}
            columns={gridColumns}
            rows={rows ?? []}
            rowRenderer={RowRenderer}
            rowKeyGetter={rowKeyGetter}
            selectedRows={state.selectedRows}
            onColumnResize={onColumnResize}
            onRowsChange={onRowsChange}
            onSelectedCellChange={onSelectedCellChange}
            onSelectedRowsChange={onSelectedRowsChange}
            className={gridClass}
            rowClass={rowClass}
            style={{ height: '100%' }}
          />
        </div>
      );
    }
  )
);

const updateColumnResize = (
  index: number,
  width: number,
  dispatch: (value: unknown) => void
) => {
  dispatch({
    type: 'UPDATE_COLUMN_SIZE',
    payload: { index, width: Math.round(width) },
  });
};
const updateColumnResizeDebounced = AwesomeDebouncePromise(
  updateColumnResize,
  500
);
