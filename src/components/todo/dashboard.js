import React from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft, FilePlus } from 'react-feather';

function Dashboard({ bins, handleOpen, handleCreate, handleBack }) {
  return (
    <div>
      <div className="flex items-center border-b pb-2">
        <button
          className="bg-paper hover:bg-paper-darker text-accent p-1 rounded-full"
          onClick={handleBack}
        >
          <ArrowLeft className="stroke-current" />
        </button>
        <span className="flex-grow"></span>
        <button
          className="bg-paper hover:bg-paper-darker text-accent py-1 px-2 mb-1 rounded"
          onClick={handleCreate}
        >
          <FilePlus className="stroke-current inline" />
          <span className="font-bold text-sm uppercase mx-1">Create</span>
        </button>
      </div>
      {bins.length > 0 ? (
        <table className="w-full mt-2">
          <thead>
            <tr className="">
              <th className="px-2 py-1 text-left">Name</th>
              <th className="px-2 py-1 text-right">Date modified</th>
            </tr>
          </thead>
          <tbody>
            {bins.map(({ name, updatedAt }) => (
              <tr
                key={name}
                className="hover:bg-paper-darker cursor-pointer"
                onClick={ev => handleOpen(name)}
              >
                <td className="px-2 py-1">{name}</td>
                <td className="px-2 py-1 text-right">
                  {new Date(updatedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p class="mt-2">Click create to start a sheet</p>
      )}
    </div>
  );
}

Dashboard.propTypes = {
  bins: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      updatedAt: PropTypes.string,
    })
  ).isRequired,
  handleOpen: PropTypes.func.isRequired,
  handleCreate: PropTypes.func.isRequired,
  handleBack: PropTypes.func.isRequired,
};

export default Dashboard;
