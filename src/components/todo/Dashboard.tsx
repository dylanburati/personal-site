import React, { useState, useContext, useEffect, useCallback } from "react";
import { ArrowLeft, FilePlus, Trash2 } from "react-feather";
import { Table } from "../Table";
import { UserContext } from "../chat/UserContext";
import { useAsyncTask } from "../../hooks/useAsyncTask";

export type Bin = {
  id: string;
  title: string;
  updatedAt: number;
};

export type DashboardProps = {
  handleOpen: (bin: Bin) => void;
  handleCreate: () => void;
  handleBack: () => void;
};

export const Dashboard: React.FC<DashboardProps> = ({
  handleOpen,
  handleCreate,
  handleBack,
}) => {
  const { authHttp, user, userLoading } = useContext(UserContext);
  const [bins, setBins] = useState<Bin[]>([]);
  const [selected, setSelected] = useState<Bin[]>([]);
  const withoutDeleted = selected.filter((e) => bins.includes(e));
  if (withoutDeleted.length < selected.length) {
    setSelected(withoutDeleted);
  }
  const handleSelect = (item: Bin, isSelected: boolean) => {
    setSelected([...selected, item].filter((e) => isSelected || e !== item));
  };

  const getBins = useAsyncTask(
    useCallback(async (client) => {
      const data = await client.get("/g/todo");
      if (data.success) setBins(data.conversations);
    }, [])
  );
  useEffect(() => {
    if (!user && !userLoading) handleBack();
  }, [handleBack, user, userLoading]);
  useEffect(() => {
    if (user && authHttp) getBins.run(authHttp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authHttp, user]);

  const deleteBins = async () => {
    if (!authHttp) {
      return;
    }
    const data = await authHttp.del("/g", {
      ids: selected.map((item) => item.id),
    });
    if (data.success) {
      setBins((arr) =>
        arr.filter((item) => !selected.some((e) => e.id === item.id))
      );
    }
  };

  return (
    <div>
      <div className="flex items-center border-b pb-2">
        <button
          className="hover:bg-paper-darker text-accent p-1 rounded-full"
          onClick={handleBack}
        >
          <ArrowLeft className="stroke-current" />
        </button>
        <span className="flex-grow"></span>
        {selected.length > 0 && (
          <button
            className="hover:bg-paper-darker text-accent py-1 px-2 mb-1 rounded"
            onClick={deleteBins}
          >
            <Trash2 className="stroke-current inline" />
            <span className="font-bold text-sm uppercase mx-1">Delete</span>
          </button>
        )}
        <button
          className="hover:bg-paper-darker text-accent py-1 px-2 mb-1 rounded"
          onClick={handleCreate}
        >
          <FilePlus className="stroke-current inline" />
          <span className="font-bold text-sm uppercase mx-1">Create</span>
        </button>
      </div>
      <Table
        rows={bins}
        columns={[
          {
            label: "Name",
            class: "text-left",
            render: ({ title }) => title,
          },
          {
            label: "Date modified",
            class: "text-right",
            render: ({ updatedAt: ts }) =>
              ts ? new Date(ts).toLocaleString() : "-",
          },
        ]}
        handleSelect={handleSelect}
        handleOpen={handleOpen}
        keySelector={(e) => e.id}
        noDataText="Click create to start a sheet"
      />
    </div>
  );
};
