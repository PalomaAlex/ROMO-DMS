import React, { useState } from "react";
import { useList, useUpdate } from "@refinedev/core";
import { Tree, Form, Input, Button, Card, Select, Tag, Drawer } from "antd";
import { useDrawerForm } from "@refinedev/antd";
import { PlusOutlined } from "@ant-design/icons";
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
    const { result, query } = useList({
        resource: "t_dept",
        pagination: { mode: "off" },
        meta: { idColumnName: "dept_id" },
    });
    const deptList = result.data || [];
    const [selectedDept, setSelectedDept] = useState<any>(null);
    const [form] = Form.useForm();
    const { mutate } = useUpdate();

    // Drawer 新建部门
    const {
        formProps,
        drawerProps,
        show,
        saveButtonProps,
    } = useDrawerForm({
        resource: "t_dept",
        action: "create",
        meta: { idColumnName: "dept_id" },
        redirect: false,
        onMutationSuccess: () => {
            query.refetch();
        },
    });

    // 构建树结构
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
                    query.refetch();
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

    return (
        <div style={{ display: "flex", gap: 24 }}>
            <Card
                title="部门树"
                style={{ flex: 1 }}
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => show()}
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
            <Drawer {...drawerProps} width={480}>
                <TDeptCreate formProps={formProps} saveButtonProps={saveButtonProps} />
            </Drawer>
        </div>
    );
};