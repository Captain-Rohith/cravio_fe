import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable } from "@/components/shared/data-table";

interface RowData {
  id: string;
  amount: number;
}

describe("DataTable", () => {
  it("sorts rows by selected column", async () => {
    const rows: RowData[] = [
      { id: "2", amount: 25 },
      { id: "1", amount: 10 },
    ];

    render(
      <DataTable
        rows={rows}
        rowKey={(row) => row.id}
        columns={[
          { key: "id", header: "ID" },
          { key: "amount", header: "Amount" },
        ]}
      />,
    );

    const sortButton = screen.getByRole("button", { name: /Amount/i });
    await userEvent.click(sortButton);
    expect(screen.getAllByRole("cell")[0]).toHaveTextContent("1");

    await userEvent.click(sortButton);

    expect(screen.getAllByRole("cell")[0]).toHaveTextContent("2");
  });
});
