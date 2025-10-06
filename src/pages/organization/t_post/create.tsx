import React from "react";
import { Form, Input, Select, Button } from "antd";

const statusOptions = [
    { value: "0", label: "正常" },
    { value: "1", label: "停用" },
    { value: "2", label: "删除" },
];

export const TPostCreate: React.FC<{
    formProps: any;
    saveButtonProps: any;
}> = ({ formProps, saveButtonProps }) => {
    return (
        <Form {...formProps} layout="vertical">
            <Form.Item
                label="岗位名称"
                name="post_name"
                rules={[{ required: true, message: "请输入岗位名称" }]}
            >
                <Input placeholder="请输入岗位名称" />
            </Form.Item>
            <Form.Item
                label="状态"
                name="post_status"
                rules={[{ required: true, message: "请选择状态" }]}
            >
                <Select options={statusOptions} placeholder="请选择状态" />
            </Form.Item>
            <Form.Item
                label="备注"
                name="post_remark"
            >
                <Input.TextArea placeholder="请输入备注" />
            </Form.Item>
            <Button type="primary" htmlType="submit" {...saveButtonProps} style={{ marginTop: 16 }}>
                保存
            </Button>
        </Form>
    );
};