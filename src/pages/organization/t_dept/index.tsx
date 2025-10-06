import React, { useState, useEffect, useMemo } from "react";
import { useList, useUpdate, useMany } from "@refinedev/core";
import { Tree, Form, Input, Button, Card, Select, Tag, Drawer, Spin, Avatar } from "antd";
import { useDrawerForm } from "@refinedev/antd";
import { PlusOutlined, UserOutlined } from "@ant-design/icons";
import { TDeptCreate } from "./create";

const statusOptions = [
    { value: "0", label: "正常" },
    { value: "1", label: "停用" },
    { value: "2", label: "删除" },
];

const statusColorMap: Record<string, string> = {
    "0": "green",
    "1": "orange",
    "2": "red",
};

const statusTextMap: Record<string, string> = {
    "0": "正常",
    "1": "停用",
    "2": "删除",
};

export const TDeptDashboard: React.FC = () => {
    // 部门列表
    const { result: deptResult, query: deptQuery } = useList({
        resource: "t_dept",
        pagination: { mode: "off" },
        meta: { idColumnName: "dept_id" },
    });
    const deptList = deptResult.data || [];

    // 用户-部门关联表
    const { result: userDeptResult } = useList({
        resource: "t_user_dept",
        pagination: { mode: "off" },
    });
    const userDeptList = userDeptResult.data || [];

    // 用户表
    const { result: userResult } = useList({
        resource: "t_user",
        pagination: { mode: "off" },
    });
    const userList = userResult.data || [];

    const [selectedDept, setSelectedDept] = useState<any>(null);
    const [form] = Form.useForm();
    const { mutate } = useUpdate();

    // Drawer 新建部门
    const {
        formProps: createFormProps,
        drawerProps: createDrawerProps,
        show: showCreateDrawer,
        saveButtonProps: createSaveButtonProps,
        form: createForm,
    } = useDrawerForm({
        resource: "t_dept",
        action: "create",
        meta: { idColumnName: "dept_id" },
        redirect: false,
        onMutationSuccess: () => {
            deptQuery.refetch();
        },
        defaultFormValues: {
            dept_status: "0", // 设置默认值为“正常”
        },
    });
    // 每次打开Drawer表单时设置默认值
    useEffect(() => {
        if (createDrawerProps.open) {
            // 先重置表单
            createForm.resetFields();
            // 再设置默认值
            createForm.setFieldsValue({ dept_status: "0" });
        }
    }, [createDrawerProps.open]);

    // 统计每个部门的成员数量
    const deptMemberCount = useMemo(() => {
        const count: Record<string, number> = {};
        userDeptList.forEach(item => {
            if (item.del_flag === "0") {
                count[item.dept_id] = (count[item.dept_id] || 0) + 1;
            }
        });
        return count;
    }, [userDeptList]);

    // 构建树结构，节点中显示成员数量并可点击
    const [memberDrawerDeptId, setMemberDrawerDeptId] = useState<number | null>(null);

    const buildTree = (list: any[]) => {
        const map: Record<string, any> = {};
        list.forEach(item => {
            map[item.dept_id] = {
                ...item,
                key: item.dept_id,
                title: (
                    <span style={{ fontWeight: 500 }}>
                        {item.dept_name}
                        <Tag
                            color={statusColorMap[item.dept_status]}
                            style={{ marginLeft: 8 }}
                        >
                            {statusTextMap[item.dept_status]}
                        </Tag>
                        {deptMemberCount[item.dept_id] > 0 && (
                            <a
                                style={{ marginLeft: 8 }}
                                onClick={e => {
                                    e.stopPropagation();
                                    setMemberDrawerDeptId(item.dept_id);
                                }}
                            >
                                成员({deptMemberCount[item.dept_id]})
                            </a>
                        )}
                    </span>
                ),
                children: [],
            };
        });
        const tree: any[] = [];
        list.forEach(item => {
            if (item.dept_parent_id && item.dept_parent_id !== 0 && map[item.dept_parent_id]) {
                map[item.dept_parent_id].children.push(map[item.dept_id]);
            } else {
                tree.push(map[item.dept_id]);
            }
        });
        return tree;
    };

    // 选中节点时，填充表单
    const onSelect = (_: React.Key[], info: any) => {
        setSelectedDept(info.node);
        form.setFieldsValue({
            ...info.node,
            dept_status: info.node.dept_status,
        });
    };

    // 提交编辑
    const onFinish = (values: any) => {
        mutate(
            {
                resource: "t_dept",
                id: selectedDept.dept_id,
                values,
                meta: { idColumnName: "dept_id" },
            },
            {
                onSuccess: () => {
                    deptQuery.refetch();
                },
            }
        );
    };

    // 父部门下拉选项（排除自己）
    const parentOptions = deptList
        .filter(item => !selectedDept || item.dept_id !== selectedDept.dept_id)
        .map(item => ({
            value: item.dept_id,
            label: item.dept_name,
        }));

    // 当前 Drawer 展示的成员 user_id 列表
    const memberUserIds = useMemo(() => {
        if (!memberDrawerDeptId) return [];
        return userDeptList
            .filter(item => item.dept_id === memberDrawerDeptId && item.del_flag === "0")
            .map(item => item.user_id);
    }, [memberDrawerDeptId, userDeptList]);

    // 拉取成员详细信息
    const { result: memberUsersResult, query: memberUsersQuery } = useMany({
        resource: "t_user",
        ids: memberUserIds,
        meta: { idColumnName: "user_id" }, // 定义主键字段
        queryOptions: { enabled: memberUserIds.length > 0 },
    });

    const memberUsers = memberUsersResult.data || [];
    const memberUsersLoading = memberUsersQuery.isLoading;

    return (
        <div style={{ display: "flex", gap: 24 }}>
            <Card
                title="部门树"
                style={{ flex: 1 }}
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => showCreateDrawer()}
                    >
                        新建部门
                    </Button>
                }
            >
                <Tree
                    treeData={buildTree(deptList)}
                    defaultExpandAll
                    onSelect={onSelect}
                />
            </Card>
            <Card title="编辑部门" style={{ flex: 1 }}>
                <Form form={form} onFinish={onFinish} layout="vertical">
                    <Form.Item label="部门名称" name="dept_name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="父部门" name="dept_parent_id">
                        <Select
                            options={[{ value: 0, label: "无" }, ...parentOptions]}
                            allowClear
                        />
                    </Form.Item>
                    <Form.Item label="状态" name="dept_status" rules={[{ required: true }]}>
                        <Select options={statusOptions} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" disabled={!selectedDept}>
                        保存
                    </Button>
                </Form>
            </Card>
            <Drawer {...createDrawerProps} width={480}>
                <TDeptCreate formProps={createFormProps} saveButtonProps={createSaveButtonProps} />
            </Drawer>
            <Drawer
                open={!!memberDrawerDeptId}
                onClose={() => setMemberDrawerDeptId(null)}
                title="部门成员"
                width={400}
            >
                {memberUsersLoading ? (
                    <Spin />
                ) : (
                    <div>
                        {memberUsers.length === 0 && <div>暂无成员</div>}
                        {memberUsers.map((user: any) => (
                            <div key={user.user_id} style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                                <Avatar src={user.user_avatar} icon={<UserOutlined />} style={{ marginRight: 12 }} />
                                <span>{user.user_nickname}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Drawer>
        </div>
    );
};