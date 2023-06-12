import React from 'react';

export type TableProps<T> = {
  rows: T[];
  columns: {
    label: string;
    class?: string;
    render: (item: T) => React.ReactNode;
  }[];
  handleSelect: (item: T, isSelected: boolean) => void;
  handleOpen: (item: T) => void;
  keySelector: (item: T) => string;
  noDataText: string;
}

export function Table<T>({
  rows,
  columns,
  handleSelect,
  handleOpen,
  keySelector,
  noDataText,
}: TableProps<T>) {
  if (rows.length === 0) {
    return <p className="mt-2">{noDataText || ''}</p>;
  }

  return (
    <table className="w-full mt-2">
      <thead>
        <tr>
          <th style={{ width: 1 }}></th>
          {columns.map((col, i) => (
            <th key={i} className={'px-2 py-1 ' + col.class || ''}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(item => (
          <tr
            key={keySelector(item)}
            className="hover:bg-paper-darker cursor-pointer"
            onClick={ev => handleOpen(item)}
          >
            <td className="px-2 pt-1">
              <input
                type="checkbox"
                onClick={ev => ev.stopPropagation()}
                onChange={ev => handleSelect(item, ev.target.checked)}
              ></input>
            </td>
            {columns.map((col, i) => (
              <td key={i} className={'px-2 py-1 ' + col.class || ''}>
                {col.render(item)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
