import * as React from 'react';
import { Button, IconMenu, Toggle, IconX } from '@supabase/ui';
import { useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { XYCoord } from 'dnd-core';
import { useDispatch, useTrackedState } from '../../../store';
import { DragItem } from '../../../types';

type SortRowProps = {
  columnName: string;
  index: number;
};

const SortRow: React.FC<SortRowProps> = ({ columnName, index }) => {
  const state = useTrackedState();
  const dispatch = useDispatch();
  const column = state?.table?.columns.find((x) => x.name === columnName);
  const sort = state?.sorts.find((x) => x.column === columnName);
  if (!column || !sort) return null;

  const ref = React.useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'sort-row',
    item: () => {
      return { key: columnName, index };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ handlerId }, drop] = useDrop({
    accept: 'sort-row',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      moveSort(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  function onToogle(value: boolean) {
    dispatch({
      type: 'UPDATE_SORT',
      payload: { column: columnName, ascending: value },
    });
  }

  function onDeleteClick() {
    dispatch({
      type: 'REMOVE_SORT',
      payload: { column: columnName },
    });
  }

  const moveSort = (dragIndex: number, hoverIndex: number) => {
    if (dragIndex == hoverIndex) return;
    dispatch({
      type: 'MOVE_SORT',
      payload: { fromIndex: dragIndex, toIndex: hoverIndex },
    });
  };

  const opacity = isDragging ? 0 : 1;
  drag(drop(ref));

  return (
    <div
      className="flex items-center gap-3 px-3"
      ref={ref}
      style={{ opacity }}
      data-handler-id={handlerId}
    >
      <Button
        icon={<IconX strokeWidth={1.5} size={14} />}
        size="tiny"
        type="text"
        onClick={onDeleteClick}
      />
      <div className="grow">
        <span className="flex items-center gap-1 grow text-sm text-scale-1200 truncate">
          <span className="text-xs text-scale-900">
            {index > 0 ? 'then by' : 'sort by'}
          </span>
          {column.name}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <label className="text-xs text-scale-900">ascending:</label>
        <Toggle
          size="tiny"
          layout="flex"
          defaultChecked={sort.ascending}
          // @ts-ignore
          onChange={(e: boolean) => onToogle(e)}
        />
      </div>
      <span className="transition-color text-scale-900 hover:text-scale-1100">
        <IconMenu strokeWidth={2} size={16} />
      </span>
    </div>
  );
};
export default React.memo(SortRow);
