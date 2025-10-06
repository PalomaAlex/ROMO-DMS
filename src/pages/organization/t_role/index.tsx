// src/pages/organization/t_role/list.tsx
import React, { useEffect, useState } from "react";
import { List, useTable, useDrawerForm } from "@refinedev/antd";
import { Table, Input, Tag, Space, Button, message, Select, Drawer } from "antd";
import type { ColumnsType } from "antd/es/table";
import { supabaseClient } from "../../../utility";
import { PlusOutlined } from "@ant-design/icons";
import { TRoleCreate } from "./create";

type RoleRow = {
  role_id: number;
  role_name: string;
  role_key: string;
  role_status: string;
  role_remark?: string | null;
  created_at?: string | null;
};

const statusOptions = [
  { value: "0", label: "正常", color: "green" },
  { value: "1", label: "停用", color: "orange" },
  { value: "2", label: "删除", color: "red" },
];

export const TRoleDashboard: React.FC = () => {
  const { tableProps, tableQuery } = useTable<any>({
    resource: "t_role",
    sorters: {
        initial: [{ field: "role_id", order: "asc" }],
    },
  });

  // 新建角色 Drawer
  const {
    formProps: createFormProps,
    drawerProps: createDrawerProps,
    show: showCreateDrawer,
    saveButtonProps: createSaveButtonProps,
    form: createForm,
  } = useDrawerForm({
    resource: "t_role",
    action: "create",
    redirect: false,
    defaultFormValues: { role_status: "0" },
    autoResetForm: true,
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
      createForm.setFieldsValue({ role_status: "0" });
    }
  }, [createDrawerProps.open]);

  const [editing, setEditing] = useState<{ roleId: number | null; field: string | null }>({
    roleId: null,
    field: null,
  });
  const [editingValue, setEditingValue] = useState<any>(null);

  const startEdit = (roleId: number, field: string, currentValue?: any) => {
    setEditing({ roleId, field });
    setEditingValue(currentValue ?? null);
  };

  const cancelEdit = () => {
    setEditing({ roleId: null, field: null });
    setEditingValue(null);
  };

  const saveEdit = async (roleId: number) => {
    const field = editing.field;
    const value = editingValue;
    if (!roleId || !field) {
      message.error("无效的编辑上下文");
      return;
    }
    try {
      const updates: any = { updated_at: new Date().toISOString() };
      updates[field] = value;
      const { error } = await supabaseClient
        .from("t_role")
        .update(updates)
        .eq("role_id", roleId);
      if (error) throw error;
      message.success("保存成功");
      tableQuery?.refetch?.();
      cancelEdit();
    } catch (err: any) {
      message.error(String(err?.message || "保存失败"));
    }
  };

  const columns: ColumnsType<RoleRow> = [
    {
      title: "角色名称",
      dataIndex: "role_name",
      key: "role_name",
      render: (_: any, record: RoleRow) => {
        const editingThis = editing.roleId === record.role_id && editing.field === "role_name";
        return editingThis ? (
          <Space>
            <Input
              style={{ minWidth: 180 }}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
            />
            <Button type="primary" onClick={() => saveEdit(record.role_id)}>保存</Button>
            <Button onClick={cancelEdit}>取消</Button>
          </Space>
        ) : (
          <span style={{ cursor: "pointer" }} onClick={() => startEdit(record.role_id, "role_name", record.role_name)}>
            {record.role_name}
          </span>
        );
      },
    },
    {
      title: "权限标识",
      dataIndex: "role_key",
      key: "role_key",
      render: (_: any, record: RoleRow) => {
        const editingThis = editing.roleId === record.role_id && editing.field === "role_key";
        return editingThis ? (
          <Space>
            <Input
              style={{ minWidth: 180 }}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
            />
            <Button type="primary" onClick={() => saveEdit(record.role_id)}>保存</Button>
            <Button onClick={cancelEdit}>取消</Button>
          </Space>
        ) : (
          <span style={{ cursor: "pointer" }} onClick={() => startEdit(record.role_id, "role_key", record.role_key)}>
            {record.role_key}
          </span>
        );
      },
    },
    {
      title: "状态",
      dataIndex: "role_status",
      key: "role_status",
      render: (_: any, record: RoleRow) => {
        const editingThis = editing.roleId === record.role_id && editing.field === "role_status";
        return editingThis ? (
          <Space>
            <Select
              style={{ minWidth: 120 }}
              value={editingValue}
              onChange={(v) => setEditingValue(v)}
              options={statusOptions}
            />
            <Button type="primary" onClick={() => saveEdit(record.role_id)}>保存</Button>
            <Button onClick={cancelEdit}>取消</Button>
          </Space>
        ) : (
          <Tag
            color={statusOptions.find(opt => opt.value === record.role_status)?.color}
            style={{ cursor: "pointer" }}
            onClick={() => startEdit(record.role_id, "role_status", record.role_status)}
          >
            {statusOptions.find(opt => opt.value === record.role_status)?.label || record.role_status}
          </Tag>
        );
      },
    },
    {
      title: "备注",
      dataIndex: "role_remark",
      key: "role_remark",
      render: (_: any, record: RoleRow) => {
        const editingThis = editing.roleId === record.role_id && editing.field === "role_remark";
        return editingThis ? (
          <Space>
            <Input
              style={{ minWidth: 220 }}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
            />
            <Button type="primary" onClick={() => saveEdit(record.role_id)}>保存</Button>
            <Button onClick={cancelEdit}>取消</Button>
          </Space>
        ) : (
          <span style={{ cursor: "pointer" }} onClick={() => startEdit(record.role_id, "role_remark", record.role_remark)}>
            {record.role_remark ?? <span style={{ color: "#999" }}>—</span>}
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
          新建角色
        </Button>
      }
    >
      <Table
        {...(tableProps as any)}
        rowKey="role_id"
        columns={columns as any}
        pagination={(tableProps as any).pagination}
      />
      <Drawer {...createDrawerProps} width={480}>
        <TRoleCreate formProps={createFormProps} saveButtonProps={createSaveButtonProps} />
      </Drawer>
    </List>
  );
};