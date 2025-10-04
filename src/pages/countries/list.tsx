import React from "react";
import { BaseRecord } from "@refinedev/core";
import { useTable, List, EditButton, ShowButton, getDefaultSortOrder, FilterDropdown, } from "@refinedev/antd";
import { Table, Space, Input, Button } from "antd";

export const CountriesList = () => {
    const { tableProps, sorters, filters } = useTable({
        sorters: { initial: [{ field: "id", order: "asc" }] },
        filters: {
            // 👇 声明 name 字段的过滤是 contains
            initial: [
                {
                    field: "name",
                    operator: "contains",
                    value: undefined,
                },
            ],
        },
        syncWithLocation: true,
    });

    return (
        <List>
            <Table {...tableProps} rowKey="id">
                <Table.Column dataIndex="id" title="Id"
                    sorter
                    defaultSortOrder={getDefaultSortOrder("id", sorters)} 
                />
                <Table.Column dataIndex="name" title="Name"
                    sorter
                    defaultSortOrder={getDefaultSortOrder("name", sorters)} 
                    // FilterDropdown will map the value to the filter
                    filterDropdown={(props) => (
                        <FilterDropdown {...props}>
                            <Input />
                        </FilterDropdown>
                    )}
                />
                <Table.Column
                    title="Actions"
                    dataIndex="actions"
                    render={(_, record: BaseRecord) => (
                        <Space>
                            <EditButton hideText size="small" recordItemId={record.id} />
                            <ShowButton hideText size="small" recordItemId={record.id} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};
