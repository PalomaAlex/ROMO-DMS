// src/pages/organization/t_dept/create.tsx
import React from "react";
import { useSelect } from "@refinedev/antd";
import { Form, Input, TreeSelect, Select, Button } from "antd";

const statusOptions = [
    { value: "0", label: "正常" },
    { value: "1", label: "停用" },
    { value: "2", label: "删除" },
];

export const TDeptCreate: React.FC<{
    formProps: any;
    saveButtonProps: any;
}> = ({ formProps, saveButtonProps }) => {
    // 在 create 组件内部获取父部门选项
    const { selectProps } = useSelect({
        resource: "t_dept",
        optionLabel: "dept_name",
        optionValue: "dept_id",
        meta: { fields: ["dept_id", "dept_name", "dept_parent_id"] },
    });

    // 构建树形数据
    const buildTree = (items: any[]): any[] => {
        const map: Record<number, any> = {};
        const tree: any[] = [];
        items.forEach((item) => {
            map[item.value] = { title: item.label, value: item.value, key: item.value, children: [] };
        });
        items.forEach((item) => {
            if (item.dept_parent_id && item.dept_parent_id !== 0 && map[item.dept_parent_id]) {
                map[item.dept_parent_id].children!.push(map[item.value]);
            } else {
                tree.push(map[item.value]);
            }
        });
        return tree;
    };

    const treeData = buildTree(
        (selectProps.options || []).map((opt: any) => ({
            label: opt.label as string,
            value: opt.value as number,
            dept_parent_id: opt.dept_parent_id || 0,
        }))
    );

    return (
        <Form {...formProps} layout="vertical">
            <Form.Item
                label="部门名称"
                name="dept_name"
                rules={[{ required: true, message: "请输入部门名称" }]}
            >
                <Input placeholder="请输入部门名称" />
            </Form.Item>
            <Form.Item label="上级部门" name="dept_parent_id">
                <TreeSelect
                    treeData={treeData}
                    placeholder="请选择上级部门"
                    allowClear
                    treeDefaultExpandAll
                />
            </Form.Item>
            <Form.Item
                label="状态"
                name="dept_status"
                rules={[{ required: true, message: "请选择状态" }]}
            >
                <Select options={statusOptions} placeholder="请选择状态" />
            </Form.Item>
            <Button type="primary" htmlType="submit" {...saveButtonProps} style={{ marginTop: 16 }}>
                保存
            </Button>
        </Form>
    );
};