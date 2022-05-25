import * as React from 'react';
import { Popover } from 'react-tiny-popover';
import { EditorProps } from '@supabase/react-data-grid';
import { useTrackedState } from '../../store';
import { BlockKeys, MonacoEditor, NullValue, EmptyValue } from '../common';

export function TextEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  onRowChange,
}: EditorProps<TRow, TSummaryRow>) {
  const state = useTrackedState();
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(true);
  const gridColumn = state.gridColumns.find(x => x.name == column.key);
  const initialValue = (row[column.key as keyof TRow] as unknown) as string;
  const [value, setValue] = React.useState<string | null>(initialValue);

  const onEscape = React.useCallback((newValue: string | null) => {
    onRowChange({ ...row, [column.key]: newValue }, true);
    setIsPopoverOpen(false);
  }, []);

  function onChange(_value: string | undefined) {
    if (!_value) setValue('');
    else setValue(_value);
  }

  return (
    <Popover
      isOpen={isPopoverOpen}
      padding={-35}
      containerClassName=""
      positions={['bottom', 'top', 'left']}
      align="start"
      content={
        <BlockKeys value={value} onEscape={onEscape}>
          <MonacoEditor
            width={`${gridColumn?.width || column.width}px`}
            value={value ?? ''}
            onChange={onChange}
          />
        </BlockKeys>
      }
    >
      <div
        className={`${
          !!value && value.trim().length == 0 ? 'sb-grid-fill-container' : ''
        } sb-grid-text-editor__trigger`}
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
      >
        {value === null ? <NullValue /> : value === '' ? <EmptyValue /> : value}
      </div>
    </Popover>
  );
}
