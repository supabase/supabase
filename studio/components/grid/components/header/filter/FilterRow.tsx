import * as React from 'react';
import { Button, Input, IconChevronDown, IconX } from '@supabase/ui';
import { DropdownControl } from '../../common';
import { useDispatch, useTrackedState } from '../../../store';
import { FilterOperatorOptions } from './Filter.constants';
import { updateFilterValueDebounced } from './Filter.utils';

/**
 * use `now` to trigger re-render as filterIdx won't change value
 * if not filterText state will not updated on delete filter
 */
type FilterRowProps = {
  filterIdx: number;
  now: number;
};

const FilterRow: React.FC<FilterRowProps> = ({ filterIdx, now }) => {
  const state = useTrackedState();
  const dispatch = useDispatch();
  const filter = state.filters[filterIdx];
  const column = state.table?.columns.find((x) => x.name === filter.column);
  const columnOptions =
    state.table?.columns?.map((x) => {
      return { value: x.name, label: x.name, postLabel: x.dataType };
    }) || [];
  const [filterValue, setFilterValue] = React.useState(filter.value);

  React.useEffect(() => {
    const filter = state.filters[filterIdx];
    setFilterValue(filter.value);
  }, [filterIdx, now]);

  function onColumnChange(column: string | number) {
    dispatch({
      type: 'UPDATE_FILTER',
      payload: { filterIdx, value: { ...filter, column } },
    });
  }

  function onOperatorChange(operator: string | number) {
    dispatch({
      type: 'UPDATE_FILTER',
      payload: { filterIdx, value: { ...filter, operator } },
    });
  }

  function onFilterChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setFilterValue(value);
    updateFilterValueDebounced(
      {
        filterIdx,
        value: { ...filter, value: value },
      },
      dispatch
    );
  }

  function onRemoveFilter() {
    dispatch({
      type: 'REMOVE_FILTER',
      payload: { index: filterIdx },
    });
  }

  return (
    <div className="sb-grid-filter-row px-3">
      <DropdownControl
        align="start"
        options={columnOptions}
        onSelect={onColumnChange}
      >
        <Button
          as="span"
          type="outline"
          icon={
            <div className="text-scale-900">
              <IconChevronDown strokeWidth={1.5} size={14} />
            </div>
          }
          className="w-32"
        >
          {column?.name || ''}
        </Button>
      </DropdownControl>
      <DropdownControl
        align="start"
        options={FilterOperatorOptions}
        onSelect={onOperatorChange}
      >
        <Button
          as="span"
          type="outline"
          icon={
            <div className="text-scale-900">
              <IconChevronDown strokeWidth={1.5} size={14} />
            </div>
          }
        >
          {filter.operator}
        </Button>
      </DropdownControl>
      <Input
        size="tiny"
        className="w-full"
        placeholder="Enter a value"
        value={filterValue}
        onChange={onFilterChange}
      />
      <Button
        icon={<IconX strokeWidth={1.5} size={14} />}
        size="tiny"
        type="text"
        onClick={onRemoveFilter}
      />
    </div>
  );
};
export default React.memo(FilterRow);
