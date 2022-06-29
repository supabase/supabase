import * as React from 'react';

type NullValueProps = {};

export const NullValue: React.FC<NullValueProps> = ({}) => {
  return (
    <span className="null-value" style={{ opacity: 0.5 }}>
      NULL
    </span>
  );
};
