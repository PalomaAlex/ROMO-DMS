// src/pages/organization/t_post/list.tsx
import React, { useEffect, useState } from "react";
import { List, useTable, useDrawerForm } from "@refinedev/antd";
import { Table, Input, Tag, Space, Button, message, Select, Drawer } from "antd";
import type { ColumnsType } from "antd/es/table";
import { supabaseClient } from "../../../utility";
import { PlusOutlined } from "@ant-design/icons";
import { TPostCreate } from "./create";

type PostRow = {
    post_id: number;
    post_name: string;
    post_status: string;
    post_remark?: string | null;
    created_at?: string | null;
};

const statusOptions = [
    { value: "0", label: "正常", color: "green" },
    { value: "1", label: "停用", color: "orange" },
    { value: "2", label: "删除", color: "red" },
];

export const TPostDashboard: React.FC = () => {
    const { tableProps, tableQuery } = useTable<any>({
        resource: "t_post",
    });

    // 新建岗位 Drawer
    const {
        formProps: createFormProps,
        drawerProps: createDrawerProps,
        show: showCreateDrawer,
        saveButtonProps: createSaveButtonProps,
        form: createForm, // 👈 可以拿到 form 实例
    } = useDrawerForm({
        resource: "t_post",
        action: "create",
        redirect: false,
        defaultFormValues: { post_status: "0" },
        autoResetForm: true, //似乎无效
        onMutationSuccess: () => {
            tableQuery.refetch();
        },
    });
    // 每次打开Drawer表单时设置默认值
    useEffect(() => {
        if (createDrawerProps.open) {
            // 先重置表单
            createForm.resetFields();
            // 再设置默认值
            createForm.setFieldsValue({ post_status: "0" });
        }
    }, [createDrawerProps.open]);

    const [editing, setEditing] = useState<{ postId: number | null; field: string | null }>({
        postId: null,
        field: null,
    });
    const [editingValue, setEditingValue] = useState<any>(null);

    const startEdit = (postId: number, field: string, currentValue?: any) => {
        setEditing({ postId, field });
        setEditingValue(currentValue ?? null);
    };

    const cancelEdit = () => {
        setEditing({ postId: null, field: null });
        setEditingValue(null);
    };

    const saveEdit = async (postId: number) => {
        const field = editing.field;
        const value = editingValue;
        if (!postId || !field) {
            message.error("无效的编辑上下文");
            return;
        }
        try {
            const updates: any = { updated_at: new Date().toISOString() };
            updates[field] = value;
            const { error } = await supabaseClient
                .from("t_post")
                .update(updates)
                .eq("post_id", postId);
            if (error) throw error;
            message.success("保存成功");
            tableQuery?.refetch?.();
            cancelEdit();
        } catch (err: any) {
            message.error(String(err?.message || "保存失败"));
        }
    };

    const columns: ColumnsType<PostRow> = [
        {
            title: "岗位名称",
            dataIndex: "post_name",
            key: "post_name",
            render: (_: any, record: PostRow) => {
                const editingThis = editing.postId === record.post_id && editing.field === "post_name";
                return editingThis ? (
                    <Space>
                        <Input
                            style={{ minWidth: 180 }}
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                        />
                        <Button type="primary" onClick={() => saveEdit(record.post_id)}>保存</Button>
                        <Button onClick={cancelEdit}>取消</Button>
                    </Space>
                ) : (
                    <span style={{ cursor: "pointer" }} onClick={() => startEdit(record.post_id, "post_name", record.post_name)}>
                        {record.post_name}
                    </span>
                );
            },
        },
        {
            title: "状态",
            dataIndex: "post_status",
            key: "post_status",
            render: (_: any, record: PostRow) => {
                const editingThis = editing.postId === record.post_id && editing.field === "post_status";
                return editingThis ? (
                    <Space>
                        <Select
                            style={{ minWidth: 120 }}
                            value={editingValue}
                            onChange={(v) => setEditingValue(v)}
                            options={statusOptions}
                        />
                        <Button type="primary" onClick={() => saveEdit(record.post_id)}>保存</Button>
                        <Button onClick={cancelEdit}>取消</Button>
                    </Space>
                ) : (
                    <Tag
                        color={statusOptions.find(opt => opt.value === record.post_status)?.color}
                        style={{ cursor: "pointer" }}
                        onClick={() => startEdit(record.post_id, "post_status", record.post_status)}
                    >
                        {statusOptions.find(opt => opt.value === record.post_status)?.label || record.post_status}
                    </Tag>
                );
            },
        },
        {
            title: "备注",
            dataIndex: "post_remark",
            key: "post_remark",
            render: (_: any, record: PostRow) => {
                const editingThis = editing.postId === record.post_id && editing.field === "post_remark";
                return editingThis ? (
                    <Space>
                        <Input
                            style={{ minWidth: 220 }}
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                        />
                        <Button type="primary" onClick={() => saveEdit(record.post_id)}>保存</Button>
                        <Button onClick={cancelEdit}>取消</Button>
                    </Space>
                ) : (
                    <span style={{ cursor: "pointer" }} onClick={() => startEdit(record.post_id, "post_remark", record.post_remark)}>
                        {record.post_remark ?? <span style={{ color: "#999" }}>—</span>}
                    </span>
                );
            },
        },
        {
            title: "创建时间",
            dataIndex: "created_at",
            key: "created_at",
            render: (val: string) => val ? new Date(val).toLocaleString() : "—",
        },
    ];

    return (
        <List
            headerButtons={
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => showCreateDrawer()}
                >
                    新建岗位
                </Button>
            }
        >
            <Table
                {...(tableProps as any)}
                rowKey="post_id"
                columns={columns as any}
                pagination={(tableProps as any).pagination}
            />
            <Drawer {...createDrawerProps} width={480}>
                <TPostCreate formProps={createFormProps} saveButtonProps={createSaveButtonProps} />
            </Drawer>
        </List>
    );
};