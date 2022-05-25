import React, { FC } from 'react';
import { Button, IconList, IconChevronDown, Popover } from '@supabase/ui';
import { DropdownControl } from '../../common';
import { useDispatch, useTrackedState } from '../../../store';
import SortRow from './SortRow';

const SortPopover: FC = () => {
  const state = useTrackedState();
  const btnText =
    state.sorts.length > 0
      ? `Sorted by ${state.sorts.length} rule${
          state.sorts.length > 1 ? 's' : ''
        }`
      : 'Sort';

  return (
    <Popover
      size="large"
      align="start"
      className="sb-grid-sort-popover"
      overlay={<Sort />}
    >
      <Button
        as={'span'}
        type="text"
        icon={<IconList />}
        style={{ padding: '4px 8px' }}
      >
        {btnText}
      </Button>
    </Popover>
  );
};
export default SortPopover;

const Sort: FC = () => {
  const state = useTrackedState();
  const dispatch = useDispatch();
  const columns = state?.table?.columns!.filter((x) => {
    const found = state.sorts.find((y) => y.column == x.name);
    return !found;
  });
  const dropdownOptions =
    columns?.map((x) => {
      return { value: x.name, label: x.name };
    }) || [];

  function onAddSort(columnName: string | number) {
    dispatch({
      type: 'ADD_SORT',
      payload: { column: columnName, ascending: true },
    });
  }

  return (
    <div className="py-2 space-y-2">
      {state.sorts.map((x, index) => (
        <SortRow key={x.column} columnName={x.column} index={index} />
      ))}
      {state.sorts.length == 0 && (
        <div className="space-y-1 px-3">
          <h5 className="text-sm text-scale-1100">
            No sorts applied to this view
          </h5>
          <p className="text-xs text-scale-900">
            Add a column below to sort the view
          </p>
        </div>
      )}

      <Popover.Seperator />
      <div className="px-3">
        {columns && columns.length > 0 ? (
          <DropdownControl
            options={dropdownOptions}
            onSelect={onAddSort}
            side="bottom"
            align="start"
          >
            <Button
              as="span"
              type="text"
              iconRight={<IconChevronDown />}
              className="sb-grid-dropdown__item-trigger"
            >
              {`Pick ${
                state.sorts.length > 1 ? 'another' : 'a'
              } column to sort by`}
            </Button>
          </DropdownControl>
        ) : (
          <p className="text-sm text-scale-1100">All columns have been added</p>
        )}
      </div>
    </div>
  );
};
