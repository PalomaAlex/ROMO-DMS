import React from "react";
import { Form, Input, Select, Button } from "antd";

const statusOptions = [
    { value: "0", label: "正常" },
    { value: "1", label: "停用" },
    { value: "2", label: "删除" },
];

export const TRoleCreate: React.FC<{
    formProps: any;
    saveButtonProps: any;
}> = ({ formProps, saveButtonProps }) => {
    return (
        <Form {...formProps} layout="vertical">
            <Form.Item
                label="角色名称"
                name="role_name"
                rules={[{ required: true, message: "请输入角色名称" }]}
            >
                <Input placeholder="请输入角色名称" />
            </Form.Item>
            <Form.Item
                label="权限标识"
                name="role_key"
                rules={[{ required: true, message: "请输入权限标识" }]}
            >
                <Input placeholder="请输入权限标识" />
            </Form.Item>
            <Form.Item
                label="状态"
                name="role_status"
                rules={[{ required: true, message: "请选择状态" }]}
            >
                <Select options={statusOptions} placeholder="请选择状态" />
            </Form.Item>
            <Form.Item
                label="备注"
                name="role_remark"
            >
                <Input.TextArea placeholder="请输入备注" />
            </Form.Item>
            <Button type="primary" htmlType="submit" {...saveButtonProps} style={{ marginTop: 16 }}>
                保存
            </Button>
        </Form>
    );
};