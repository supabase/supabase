import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { EditorProps } from '@supabase/react-data-grid';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

interface Props<TRow, TSummaryRow = unknown> extends EditorProps<TRow, TSummaryRow> {
  format: string;
}

const INPUT_DATE_TIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

function BaseEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  format,
  onRowChange,
  onClose,
}: Props<TRow, TSummaryRow>) {
  const [inputValue, setInputValue] = useState<string>(row[column.key as keyof TRow] || ''); 
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []); 

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const _value = event.target.value;

    if (_value.length === 0) {
      setInputValue('');
      onRowChange({ ...row, [column.key]: null });
    } else {
      setInputValue(_value);
      const _timeValue = dayjs(_value).format(format);
      onRowChange({ ...row, [column.key]: _timeValue });
    }
  }

  return (
    <input
      className="sb-grid-datetime-editor"
      ref={(input) => (inputRef.current = input)}
      value={inputValue}
      onChange={onChange}
      onBlur={() => onClose(true)}
      type="datetime-local"
      step="1"
    />
  );
}

export function DateTimeEditor<TRow, TSummaryRow = unknown>(props: EditorProps<TRow, TSummaryRow>) {
  return <BaseEditor {...props} format={INPUT_DATE_TIME_FORMAT} />;
}

export function DateTimeWithTimezoneEditor<TRow, TSummaryRow = unknown>(
  props: EditorProps<TRow, TSummaryRow>
) {
  return <BaseEditor {...props} format="YYYY-MM-DDTHH:mm:ssZ" />;
}
