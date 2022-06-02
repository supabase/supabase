import * as React from 'react';
import AwesomeDebouncePromise from 'awesome-debounce-promise';
import {
  Button,
  InputNumber,
  Typography,
  IconArrowRight,
  IconArrowLeft,
} from '@supabase/ui';
import { DropdownControl } from '../../common';
import { useDispatch, useTrackedState } from '../../../store';

const updatePage = (payload: number, dispatch: (value: unknown) => void) => {
  dispatch({
    type: 'SET_PAGE',
    payload: payload,
  });
};
const updatePageDebounced = AwesomeDebouncePromise(updatePage, 550);

const rowsPerPageOptions = [
  { value: 100, label: '100 rows' },
  { value: 500, label: '500 rows' },
  { value: 1000, label: '1000 rows' },
];

type PaginationProps = {};

const Pagination: React.FC<PaginationProps> = () => {
  const state = useTrackedState();
  const dispatch = useDispatch();
  const [page, setPage] = React.useState(state.page);
  const maxPages = Math.ceil(state.totalRows / state.rowsPerPage);
  const totalPages = state.totalRows > 0 ? maxPages : 1;

  React.useEffect(() => {
    if (state.page != page) setPage(state.page);
  }, [state.page, page]);

  function onPreviousPage() {
    if (state.page > 1) {
      const previousPage = state.page - 1;
      setPage(previousPage);
      dispatch({ type: 'SET_PAGE', payload: previousPage });
    }
  }

  function onNextPage() {
    if (state.page < maxPages) {
      const nextPage = state.page + 1;
      setPage(nextPage);
      dispatch({ type: 'SET_PAGE', payload: nextPage });
    }
  }

  function onPageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    const pageNum = Number(value);
    setPage(pageNum);
    updatePageDebounced(pageNum, dispatch);
  }

  function onRowsPerPageChange(value: string | number) {
    dispatch({ type: 'SET_ROWS_PER_PAGE', payload: value });
  }

  return (
    <div className="sb-grid-pagination">
      {state.totalRows < 0 ? (
        <Typography.Text>... loading total records</Typography.Text>
      ) : (
        <>
          <Button
            icon={<IconArrowLeft />}
            type="outline"
            disabled={state.page <= 1}
            onClick={onPreviousPage}
            style={{ padding: '3px 10px' }}
          />
          <Typography.Text>Page</Typography.Text>
          <div className="sb-grid-pagination-input-container">
            <InputNumber
              value={page}
              onChange={onPageChange}
              className="sb-grid-pagination-input"
              size="tiny"
              style={{
                width: '3rem',
              }}
              max={maxPages}
              min={1}
            />
          </div>
          <Typography.Text>{`of ${totalPages}`}</Typography.Text>
          <Button
            icon={<IconArrowRight />}
            type="outline"
            disabled={state.page >= maxPages}
            onClick={onNextPage}
            style={{ padding: '3px 10px' }}
          />

          <DropdownControl
            options={rowsPerPageOptions}
            onSelect={onRowsPerPageChange}
            side="top"
            align="start"
          >
            <Button
              as="span"
              type="outline"
              style={{ padding: '3px 10px' }}
            >{`${state.rowsPerPage} rows`}</Button>
          </DropdownControl>
          <Typography.Text>
            {`${state.totalRows.toLocaleString()} records`}
          </Typography.Text>
        </>
      )}
    </div>
  );
};
export default Pagination;
