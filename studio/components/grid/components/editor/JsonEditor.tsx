import * as React from 'react';
import { Popover } from 'react-tiny-popover';
import { EditorProps } from '@supabase/react-data-grid';
import { useTrackedState } from '../../store';
import { BlockKeys, MonacoEditor, NullValue } from '../common';

export function JsonEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  onRowChange,
}: EditorProps<TRow, TSummaryRow>) {
  const state = useTrackedState();
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(true);
  const gridColumn = state.gridColumns.find(x => x.name == column.key);
  const initialValue = row[column.key as keyof TRow] as unknown;
  const jsonString = initialValue ? JSON.stringify(initialValue) : '';
  const prettyJsonValue = prettifyJSON(jsonString);
  const [value, setValue] = React.useState<string | null>(prettyJsonValue);

  const onEscape = React.useCallback((newValue: string | null) => {
    commitChange(newValue);
    setIsPopoverOpen(false);
  }, []);

  function onChange(_value: string | undefined) {
    if (!_value || _value == '') setValue(null);
    else setValue(_value);
  }

  function commitChange(newValue: string | null) {
    if (!newValue) {
      onRowChange({ ...row, [column.key]: null }, true);
    } else if (verifyJSON(newValue)) {
      const jsonValue = JSON.parse(newValue);
      onRowChange({ ...row, [column.key]: jsonValue }, true);
    } else {
      const { onError } = state;
      if (onError) onError(Error('invalid input'));
    }
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
            language="json"
            onChange={onChange}
          />
        </BlockKeys>
      }
    >
      <div
        className={`${
          !!value && jsonString.trim().length == 0
            ? 'sb-grid-fill-container'
            : ''
        } sb-grid-json-editor__trigger`}
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
      >
        {value === null || value === '' ? <NullValue /> : jsonString}
      </div>
    </Popover>
  );
}

export const prettifyJSON = (value: string) => {
  if (value.length > 0) {
    try {
      return JSON.stringify(JSON.parse(value), undefined, 2);
    } catch (err) {
      // dont need to throw error, just return text value
      // Users have to fix format if they want to save
      return value;
    }
  } else {
    return value;
  }
};

export const minifyJSON = (value: string) => {
  try {
    return JSON.stringify(JSON.parse(value));
  } catch (err) {
    throw err;
  }
};

export const verifyJSON = (value: string) => {
  try {
    JSON.parse(value);
    return true;
  } catch (err) {
    return false;
  }
};
