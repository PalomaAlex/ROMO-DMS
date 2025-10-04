import React from "react";
import { Form, Input, Select, Button } from "antd";
import { useSelect } from "@refinedev/antd";

export const TUserCreate: React.FC<{
  formProps: any;
  saveButtonProps: any;
}> = ({ formProps, saveButtonProps }) => {
  // 部门下拉
  const { selectProps: deptSelectProps } = useSelect({
    resource: "t_dept",
    optionLabel: "dept_name",
    optionValue: "dept_id",
  });

  // 岗位下拉
  const { selectProps: postSelectProps } = useSelect({
    resource: "t_post",
    optionLabel: "post_name",
    optionValue: "post_id",
  });

  // 角色下拉
  const { selectProps: roleSelectProps } = useSelect({
    resource: "t_role",
    optionLabel: "role_name",
    optionValue: "role_id",
  });

  return (
    <Form {...formProps} layout="vertical">
      <Form.Item
        label="用户名"
        name="user_nickname"
        rules={[{ required: true, message: "请输入用户名" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="邮箱"
        name="user_email"
        rules={[{ type: "email", required: true, message: "请输入有效邮箱" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item label="部门" name="dept_ids">
        <Select {...deptSelectProps} mode="multiple" allowClear />
      </Form.Item>
      <Form.Item label="岗位" name="post_ids">
        <Select {...postSelectProps} mode="multiple" allowClear />
      </Form.Item>
      <Form.Item label="角色" name="role_ids">
        <Select {...roleSelectProps} mode="multiple" allowClear />
      </Form.Item>
      <Button type="primary" htmlType="submit" {...saveButtonProps} style={{ marginTop: 16 }}>
        保存
      </Button>
    </Form>
  );
};