import React, { FC } from 'react';
import { Button, IconPlus, IconFilter, Popover } from '@supabase/ui';
import { useDispatch, useTrackedState } from '../../../store';
import FilterRow from './FilterRow';

const FilterPopover: FC = () => {
  const state = useTrackedState();
  const btnText =
    state.filters.length > 0
      ? `Filtered by ${state.filters.length} rule${
          state.filters.length > 1 ? 's' : ''
        }`
      : 'Filter';

  return (
    <Popover
      size="large"
      align="start"
      className="sb-grid-filter-popover"
      overlay={<Filter />}
    >
      <Button
        as={'span'}
        type="text"
        icon={<IconFilter />}
        style={{ padding: '4px 8px' }}
      >
        {btnText}
      </Button>
    </Popover>
  );
};
export default FilterPopover;

const Filter: FC = () => {
  const state = useTrackedState();
  const dispatch = useDispatch();

  function onAddFilter() {
    dispatch({
      type: 'ADD_FILTER',
      payload: {
        column: state.table?.columns[0].name,
        operator: '=',
        value: '',
      },
    });
  }

  return (
    <div className="space-y-2 py-2">
      <div className="space-y-2">
        {state.filters.map((_, index) => (
          <FilterRow
            key={`filter-${index}`}
            filterIdx={index}
            now={Date.now()}
          />
        ))}
        {state.filters.length == 0 && (
          <div className="space-y-1 px-3">
            <h5 className="text-sm text-scale-1100">
              No filters applied to this view
            </h5>
            <p className="text-xs text-scale-900">
              Add a column below to filter the view
            </p>
          </div>
        )}
      </div>
      <Popover.Seperator />
      <div className="px-3">
        <Button icon={<IconPlus />} type="text" onClick={onAddFilter}>
          Add filter
        </Button>
      </div>
    </div>
  );
};
