import * as React from 'react';
import { useDispatch, useTrackedState } from '../../store';
import {
  Button,
  Divider,
  IconDownload,
  IconPlus,
  IconX,
  IconTrash,
  Typography,
} from '@supabase/ui';
import FileSaver from 'file-saver';
import FilterDropdown from './filter';
import SortPopover from './sort';
import StatusLabel from './StatusLabel';
import RefreshButton from './RefreshButton';
import { exportRowsToCsv } from '../../utils';
import { showConfirmAlert } from '../common';

type HeaderProps = {
  onAddColumn?: () => void;
  onAddRow?: () => void;
  headerActions?: React.ReactNode;
};

const Header: React.FC<HeaderProps> = ({
  onAddColumn,
  onAddRow,
  headerActions,
}) => {
  const state = useTrackedState();
  const { selectedRows } = state;

  return (
    <div className="sb-grid-header">
      <div className="sb-grid-header__inner">
        {selectedRows.size > 0 ? (
          <RowHeader />
        ) : (
          <DefaultHeader onAddColumn={onAddColumn} onAddRow={onAddRow} />
        )}
      </div>
      <div className="sb-grid-header__inner">
        {headerActions}
        <StatusLabel />
      </div>
    </div>
  );
};
export default Header;

type DefaultHeaderProps = {
  onAddColumn?: () => void;
  onAddRow?: () => void;
};
const DefaultHeader: React.FC<DefaultHeaderProps> = ({
  onAddColumn,
  onAddRow,
}) => {
  const renderNewColumn = (onAddColumn?: () => void) => {
    if (!onAddColumn) return null;
    return (
      <Button type="text" onClick={onAddColumn} style={{ padding: '4px 8px' }}>
        New Column
      </Button>
    );
  };

  const renderAddRow = (onAddRow?: () => void) => {
    if (!onAddRow) return null;
    return (
      <Button
        style={{ padding: '4px 8px' }}
        icon={<IconPlus size="tiny" />}
        onClick={onAddRow}
      >
        Insert row
      </Button>
    );
  };

  return (
    <>
      <RefreshButton />
      <FilterDropdown />
      <SortPopover />
      <Divider
        light
        type="vertical"
        className="sb-grid-header__inner__divider"
      />
      {renderNewColumn(onAddColumn)}
      {renderAddRow(onAddRow)}
    </>
  );
};

type RowHeaderProps = {};
const RowHeader: React.FC<RowHeaderProps> = ({}) => {
  const state = useTrackedState();
  const dispatch = useDispatch();

  const { selectedRows, rows: allRows, editable } = state;

  const onRowsDelete = () => {
    showConfirmAlert({
      title: 'Confirm to delete',
      message:
        'Are you sure you want to delete the selected rows? This action cannot be undone.',
      onConfirm: async () => {
        const rowIdxs = Array.from(selectedRows) as number[];
        const rows = allRows.filter((x) => rowIdxs.includes(x.idx));
        const { error } = state.rowService!.delete(rows);
        if (error) {
          if (state.onError) state.onError(error);
        } else {
          dispatch({ type: 'REMOVE_ROWS', payload: { rowIdxs } });
          dispatch({
            type: 'SELECTED_ROWS_CHANGE',
            payload: { selectedRows: new Set() },
          });
        }
      },
    });
  };

  function onRowsExportCsv() {
    const rows = allRows.filter((x) => selectedRows.has(x.idx));
    const csv = exportRowsToCsv(state.table!.columns, rows);
    const csvData = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    FileSaver.saveAs(csvData, `${state.table!.name}_rows.csv`);
  }

  function deselectRows() {
    dispatch({
      type: 'SELECTED_ROWS_CHANGE',
      payload: { selectedRows: new Set() },
    });
  }

  return (
    <>
      <Button
        type="text"
        style={{ padding: '4px' }}
        icon={<IconX size="tiny" strokeWidth={2} />}
        onClick={deselectRows}
      />
      <div>
        <Typography.Text
          small
          type="secondary"
          className="row_header__selected-rows"
        >
          {selectedRows.size > 1
            ? `${selectedRows.size} rows selected`
            : `${selectedRows.size} row selected`}
        </Typography.Text>
      </div>
      <Button
        type="primary"
        size="tiny"
        style={{ padding: '4px 8px' }}
        icon={<IconDownload />}
        onClick={onRowsExportCsv}
      >
        Export to csv
      </Button>
      {editable && (
        <>
          <Divider
            type="vertical"
            className="sb-grid-header__inner__divider"
            light
          />
          <Button
            type="default"
            size="tiny"
            style={{ padding: '4px 8px' }}
            icon={<IconTrash size="tiny" />}
            onClick={onRowsDelete}
          >
            {selectedRows.size > 1
              ? `Delete ${selectedRows.size} rows`
              : `Delete ${selectedRows.size} row`}
          </Button>
        </>
      )}
    </>
  );
};
