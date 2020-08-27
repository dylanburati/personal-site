import React from 'react';

function Table({
  rows,
  columns,
  handleSelect,
  handleOpen,
  keyField,
  noDataText,
}) {
  if (rows.length === 0) {
    return <p className="mt-2">{noDataText || ''}</p>;
  }

  return (
    <table className="w-full mt-2">
      <thead>
        <tr>
          <th style={{ width: 1 }}></th>
          {columns.map(col => (
            <th key={col.field} className={'px-2 py-1 ' + col.class || ''}>
              {col.label ?? col.field}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(item => (
          <tr
            key={item[keyField]}
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
            {columns.map(col => (
              <td key={col.field} className={'px-2 py-1 ' + col.class || ''}>
                {col.render
                  ? col.render(item[col.field], item)
                  : item[col.field]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Table;
