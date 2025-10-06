// src/pages/organization/t_user/list.tsx
import React, { useEffect, useState } from "react";
import { List, useTable, useDrawerForm } from "@refinedev/antd";
import { Table, Input, Select, Tag, Space, Button, message, Spin, Drawer } from "antd";
import type { ColumnsType } from "antd/es/table";
import { supabaseClient } from "../../../utility";
import { PlusOutlined } from "@ant-design/icons";
// import { TUserCreate } from "./create";

type UserRow = {
  user_id: string;
  user_nickname: string | null;
  user_email?: string | null;
  user_phone?: string | null;
  user_gender?: string | null; // '0' | '1' | '2'
  user_status?: string | null; // '0' | '1' | '2'
  created_at?: string | null;
  // 我们不要求在 list 的记录里包含关联数组（关联通过中间表查询）
  // 但为了显示，我们会在渲染时额外查询 assoc 并保存在 local state cache
};

type OptionItem = { value: number; label: string };

export const TUserDashboard: React.FC = () => {
  // === refine 的 Table 数据源（用于分页/排序/搜索） ===
  const { tableProps, tableQuery } = useTable<any>({
    resource: "t_user",
    // 不用传不兼容的 options，保持最简单
  });

  // 新建用户 Drawer
  // const {
  //   formProps: createFormProps,
  //   drawerProps: createDrawerProps,
  //   show: showCreateDrawer,
  //   saveButtonProps: createSaveButtonProps,
  // } = useDrawerForm({
  //   resource: "t_user",
  //   action: "create",
  //   redirect: false,
  //   onMutationSuccess: () => {
  //     // 可选：刷新列表
  //     tableQuery.refetch();
  //   },
  // });

  // === 本地 cache 用于部门/岗位/角色选项和用户对应关系显示 ===
  const [departments, setDepartments] = useState<OptionItem[]>([]);
  const [posts, setPosts] = useState<OptionItem[]>([]);
  const [roles, setRoles] = useState<OptionItem[]>([]);

  // 存放每个用户的关联值（dept_ids/post_ids/role_ids），按 user_id 索引
  const [assocCache, setAssocCache] = useState<Record<string, {
    dept_ids: number[];
    post_ids: number[];
    role_ids: number[];
  }>>({});

  // 编辑状态： { userId, field }
  const [editing, setEditing] = useState<{ userId: string | null; field: string | null }>({
    userId: null,
    field: null,
  });

  // 编辑时的临时值（单值或数组）
  const [editingValue, setEditingValue] = useState<any>(null);

  // 加载下拉选项
  useEffect(() => {
    const loadOptions = async () => {
      const { data: d1, error: e1 } = await supabaseClient
        .from("t_dept")
        .select("dept_id,dept_name")
        .order("dept_name", { ascending: true });

      const { data: d2, error: e2 } = await supabaseClient
        .from("t_post")
        .select("post_id,post_name")
        .order("post_name", { ascending: true });

      const { data: d3, error: e3 } = await supabaseClient
        .from("t_role")
        .select("role_id,role_name")
        .order("role_name", { ascending: true });

      if (e1 || e2 || e3) {
        console.error(e1 ?? e2 ?? e3);
        message.error("加载下拉数据失败（查看控制台）");
      }

      setDepartments((d1 || []).map((r: any) => ({ value: r.dept_id, label: r.dept_name })));
      setPosts((d2 || []).map((r: any) => ({ value: r.post_id, label: r.post_name })));
      setRoles((d3 || []).map((r: any) => ({ value: r.role_id, label: r.role_name })));
    };

    loadOptions();
  }, []);

  // 加载当前页面所有用户的关联（dept/post/role）并缓存到 assocCache
  useEffect(() => {
    const rows = (tableProps?.dataSource ?? []) as any[];
    if (!rows || rows.length === 0) return;

    const userIds = Array.from(new Set(rows.map((r: any) => r.user_id))).filter(Boolean) as string[];
    if (userIds.length === 0) return;

    const loadAssoc = async () => {
      // 部门关联
      const { data: ud } = await supabaseClient
        .from("t_user_dept")
        .select("user_id,dept_id")
        .in("user_id", userIds);

      const { data: up } = await supabaseClient
        .from("t_user_post")
        .select("user_id,post_id")
        .in("user_id", userIds);

      const { data: ur } = await supabaseClient
        .from("t_user_role")
        .select("user_id,role_id")
        .in("user_id", userIds);

      const newCache: Record<string, any> = {};
      userIds.forEach((id) => {
        newCache[id] = { dept_ids: [], post_ids: [], role_ids: [] };
      });

      (ud || []).forEach((rec: any) => {
        if (newCache[rec.user_id]) newCache[rec.user_id].dept_ids.push(rec.dept_id);
      });
      (up || []).forEach((rec: any) => {
        if (newCache[rec.user_id]) newCache[rec.user_id].post_ids.push(rec.post_id);
      });
      (ur || []).forEach((rec: any) => {
        if (newCache[rec.user_id]) newCache[rec.user_id].role_ids.push(rec.role_id);
      });

      // 合并进 cache（保留已有）
      setAssocCache((prev) => ({ ...prev, ...newCache }));
    };

    loadAssoc().catch((e) => console.error(e));
  }, [tableProps?.dataSource]);

  // 启动编辑某个单元格
  const startEdit = async (userId: string, field: string, currentValue?: any) => {
    setEditing({ userId, field });

    // 如果正在编辑关联类型，需要把当前关联读取成数组作为初始值
    if (field === "dept_ids" || field === "post_ids" || field === "role_ids") {
      // 先从 cache 读
      const cached = assocCache[userId];
      if (cached) {
        setEditingValue(cached[field as "dept_ids" | "post_ids" | "role_ids"] || []);
        return;
      }
      // 否则实时查询
      if (field === "dept_ids") {
        const { data } = await supabaseClient.from("t_user_dept").select("dept_id").eq("user_id", userId);
        setEditingValue((data || []).map((r: any) => r.dept_id));
      } else if (field === "post_ids") {
        const { data } = await supabaseClient.from("t_user_post").select("post_id").eq("user_id", userId);
        setEditingValue((data || []).map((r: any) => r.post_id));
      } else {
        const { data } = await supabaseClient.from("t_user_role").select("role_id").eq("user_id", userId);
        setEditingValue((data || []).map((r: any) => r.role_id));
      }
    } else {
      setEditingValue(currentValue ?? null);
    }
  };

  const cancelEdit = () => {
    setEditing({ userId: null, field: null });
    setEditingValue(null);
  };

  // 保存编辑：区分 scalar 字段 和 关联字段
  const saveEdit = async (userId: string) => {
    const field = editing.field;
    const value = editingValue;

    if (!userId || !field) {
      message.error("无效的编辑上下文");
      return;
    }

    try {
      // 关联字段 -> 操作中间表（删除旧关联 -> 插入新关联）
      if (field === "dept_ids") {
        // delete old
        await supabaseClient.from("t_user_dept").delete().eq("user_id", userId);
        if (Array.isArray(value) && value.length > 0) {
          const rows = (value as number[]).map((dept_id) => ({
            user_id: userId,
            dept_id,
            del_flag: "0",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));
          await supabaseClient.from("t_user_dept").insert(rows);
        }
        // 更新本地 cache
        setAssocCache((prev) => ({ ...prev, [userId]: { ...(prev[userId] || { dept_ids: [], post_ids: [], role_ids: [] }), dept_ids: value || [] } }));
        message.success("部门保存成功");
      } else if (field === "post_ids") {
        await supabaseClient.from("t_user_post").delete().eq("user_id", userId);
        if (Array.isArray(value) && value.length > 0) {
          const rows = (value as number[]).map((post_id) => ({
            user_id: userId,
            post_id,
            del_flag: "0",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));
          await supabaseClient.from("t_user_post").insert(rows);
        }
        setAssocCache((prev) => ({ ...prev, [userId]: { ...(prev[userId] || { dept_ids: [], post_ids: [], role_ids: [] }), post_ids: value || [] } }));
        message.success("岗位保存成功");
      } else if (field === "role_ids") {
        await supabaseClient.from("t_user_role").delete().eq("user_id", userId);
        if (Array.isArray(value) && value.length > 0) {
          const rows = (value as number[]).map((role_id) => ({
            user_id: userId,
            role_id,
            del_flag: "0",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));
          await supabaseClient.from("t_user_role").insert(rows);
        }
        setAssocCache((prev) => ({ ...prev, [userId]: { ...(prev[userId] || { dept_ids: [], post_ids: [], role_ids: [] }), role_ids: value || [] } }));
        message.success("角色保存成功");
      } else {
        // 标量字段，更新 t_user 表
        const updates: any = { updated_at: new Date().toISOString() };
        updates[field] = value;
        const { error } = await supabaseClient
          .from("t_user")
          .update(updates)
          .eq("user_id", userId);

        if (error) {
          throw error;
        }
        message.success("保存成功");
      }

      // 保持修改后重新拉取数据
      try {
        // @ts-ignore
        tableQuery?.refetch?.();
      } catch (e) {
        // ignore
      }

      cancelEdit();
    } catch (err: any) {
      console.error(err);
      message.error(String(err?.message || "保存失败"));
    }
  };

  // 渲染 helper：把 id 数组渲染成标签
  const renderAssocTags = (userId: string, type: "dept" | "post" | "role") => {
    const cache = assocCache[userId];
    const ids = cache ? (type === "dept" ? cache.dept_ids : type === "post" ? cache.post_ids : cache.role_ids) : [];
    const options = type === "dept" ? departments : type === "post" ? posts : roles;
    if (!ids || ids.length === 0) {
      return <span style={{ color: "#999" }}>—</span>;
    }
    return (
      <>
        {ids.map((id: number) => {
          const opt = options.find((o) => o.value === id);
          return <Tag key={String(id)}>{opt ? opt.label : String(id)}</Tag>;
        })}
      </>
    );
  };

  // 表格列（把每个列的 render 都实现成可点击进入编辑）
  const columns: ColumnsType<UserRow> = [
    {
      title: "昵称",
      dataIndex: "user_nickname",
      key: "user_nickname",
      render: (_: any, record: UserRow) => {
        const editingThis = editing.userId === record.user_id && editing.field === "user_nickname";
        return editingThis ? (
          <Space>
            <Input
              style={{ minWidth: 220 }}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
            />
            <Button type="primary" onClick={() => saveEdit(record.user_id)}>保存</Button>
            <Button onClick={cancelEdit}>取消</Button>
          </Space>
        ) : (
          <span style={{ cursor: "pointer" }} onClick={() => startEdit(record.user_id, "user_nickname", record.user_nickname)}>
            {record.user_nickname ?? <span style={{ color: "#999" }}>（未设置）</span>}
          </span>
        );
      },
    },
    {
      title: "邮箱",
      dataIndex: "user_email",
      key: "user_email",
      render: (_: any, record: UserRow) => {
        const editingThis = editing.userId === record.user_id && editing.field === "user_email";
        return editingThis ? (
          <Space>
            <Input
              style={{ minWidth: 260 }}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
            />
            <Button type="primary" onClick={() => saveEdit(record.user_id)}>保存</Button>
            <Button onClick={cancelEdit}>取消</Button>
          </Space>
        ) : (
          <span style={{ cursor: "pointer" }} onClick={() => startEdit(record.user_id, "user_email", record.user_email)}>
            {record.user_email ?? <span style={{ color: "#999" }}>—</span>}
          </span>
        );
      },
    },
    {
      title: "手机号",
      dataIndex: "user_phone",
      key: "user_phone",
      render: (_: any, record: UserRow) => {
        const editingThis = editing.userId === record.user_id && editing.field === "user_phone";
        return editingThis ? (
          <Space>
            <Input
              style={{ minWidth: 180 }}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
            />
            <Button type="primary" onClick={() => saveEdit(record.user_id)}>保存</Button>
            <Button onClick={cancelEdit}>取消</Button>
          </Space>
        ) : (
          <span style={{ cursor: "pointer" }} onClick={() => startEdit(record.user_id, "user_phone", record.user_phone)}>
            {record.user_phone ?? <span style={{ color: "#999" }}>—</span>}
          </span>
        );
      },
    },
    {
      title: "性别",
      dataIndex: "user_gender",
      key: "user_gender",
      width: 100,
      render: (_: any, record: UserRow) => {
        const editingThis = editing.userId === record.user_id && editing.field === "user_gender";
        return editingThis ? (
          <Space>
            <Select
              style={{ minWidth: 120 }}
              value={editingValue}
              onChange={(v) => setEditingValue(v)}
              options={[
                { label: "男", value: "0" },
                { label: "女", value: "1" },
                { label: "未知", value: "2" },
              ]}
            />
            <Button type="primary" onClick={() => saveEdit(record.user_id)}>保存</Button>
            <Button onClick={cancelEdit}>取消</Button>
          </Space>
        ) : (
          <span style={{ cursor: "pointer" }} onClick={() => startEdit(record.user_id, "user_gender", record.user_gender)}>
            {record.user_gender === "0" ? "男" : record.user_gender === "1" ? "女" : "未知"}
          </span>
        );
      },
    },
    {
      title: "状态",
      dataIndex: "user_status",
      key: "user_status",
      width: 120,
      render: (_: any, record: UserRow) => {
        const editingThis = editing.userId === record.user_id && editing.field === "user_status";
        const map: Record<string, { text: string; color: string }> = {
          "0": { text: "正常", color: "green" },
          "1": { text: "停用", color: "orange" },
          "2": { text: "删除", color: "red" },
        };
        return editingThis ? (
          <Space>
            <Select
              style={{ minWidth: 120 }}
              value={editingValue}
              onChange={(v) => setEditingValue(v)}
              options={[
                { label: "正常", value: "0" },
                { label: "停用", value: "1" },
                { label: "删除", value: "2" },
              ]}
            />
            <Button type="primary" onClick={() => saveEdit(record.user_id)}>保存</Button>
            <Button onClick={cancelEdit}>取消</Button>
          </Space>
        ) : (
          <Tag
            onClick={() => startEdit(record.user_id, "user_status", record.user_status)}
            color={map[record.user_status ?? "0"]?.color || "default"}
            style={{ cursor: "pointer" }}
          >
            {map[record.user_status ?? "0"]?.text || record.user_status}
          </Tag>
        );
      },
    },
    {
      title: "部门",
      dataIndex: "dept_ids",
      key: "dept_ids",
      render: (_: any, record: UserRow) => {
        const editingThis = editing.userId === record.user_id && editing.field === "dept_ids";
        if (editingThis) {
          return (
            <Space>
              <Select
                mode="multiple"
                style={{ minWidth: 260 }}
                value={editingValue}
                onChange={(v) => setEditingValue(v)}
                options={departments}
              />
              <Button type="primary" onClick={() => saveEdit(record.user_id)}>保存</Button>
              <Button onClick={cancelEdit}>取消</Button>
            </Space>
          );
        }
        return (
          <div style={{ cursor: "pointer" }} onClick={() => startEdit(record.user_id, "dept_ids")}>
            {renderAssocTags(record.user_id, "dept")}
          </div>
        );
      },
    },
    {
      title: "岗位",
      dataIndex: "post_ids",
      key: "post_ids",
      render: (_: any, record: UserRow) => {
        const editingThis = editing.userId === record.user_id && editing.field === "post_ids";
        if (editingThis) {
          return (
            <Space>
              <Select
                mode="multiple"
                style={{ minWidth: 220 }}
                value={editingValue}
                onChange={(v) => setEditingValue(v)}
                options={posts}
              />
              <Button type="primary" onClick={() => saveEdit(record.user_id)}>保存</Button>
              <Button onClick={cancelEdit}>取消</Button>
            </Space>
          );
        }
        return (
          <div style={{ cursor: "pointer" }} onClick={() => startEdit(record.user_id, "post_ids")}>
            {renderAssocTags(record.user_id, "post")}
          </div>
        );
      },
    },
    {
      title: "角色权限",
      dataIndex: "role_ids",
      key: "role_ids",
      render: (_: any, record: UserRow) => {
        const editingThis = editing.userId === record.user_id && editing.field === "role_ids";
        if (editingThis) {
          return (
            <Space>
              <Select
                mode="multiple"
                style={{ minWidth: 220 }}
                value={editingValue}
                onChange={(v) => setEditingValue(v)}
                options={roles}
              />
              <Button type="primary" onClick={() => saveEdit(record.user_id)}>保存</Button>
              <Button onClick={cancelEdit}>取消</Button>
            </Space>
          );
        }
        return (
          <div style={{ cursor: "pointer" }} onClick={() => startEdit(record.user_id, "role_ids")}>
            {renderAssocTags(record.user_id, "role")}
          </div>
        );
      },
    },
  ];

  return (
    <List
      canCreate={false} // 禁用 create 功能
    // headerButtons={
    //   <Button
    //     type="primary"
    //     icon={<PlusOutlined />}
    //     onClick={() => showCreateDrawer()}
    //   >
    //     新建用户
    //   </Button>
    // }
    >
      <Table
        {...(tableProps as any)}
        rowKey="user_id"
        columns={columns as any}
        pagination={(tableProps as any).pagination}
      />
      {/* <Drawer {...createDrawerProps} width={520}>
        <TUserCreate
          formProps={createFormProps}
          saveButtonProps={createSaveButtonProps}
        />
      </Drawer> */}
    </List>
  );
};