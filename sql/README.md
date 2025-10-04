数据库设计

# 命名规范
数据库名：与系统名相同，如 user, role

表名：t_ 开头，如 t_user, t_role
如果是中间表，则可结合两个表名，如 t_user_role

视图名：v_ 开头，如 v_userInfo

字段名：表名开头，如 user_id

外键：与原来名称相同；如果引用多个相同外键，用 $ 标记，如 resource_id$1, resource_id$2





===


# 用户表 t_user
COMMENT ON TABLE t_user IS '用户表';
COMMENT ON COLUMN t_user.user_id IS '用户ID';
COMMENT ON COLUMN t_user.user_nickname IS '用户昵称';
COMMENT ON COLUMN t_user.user_type IS '用户类型（00系统用户 01外部用户）';
COMMENT ON COLUMN t_user.user_email IS '用户邮箱';
COMMENT ON COLUMN t_user.user_phone IS '手机号码';
COMMENT ON COLUMN t_user.user_gender IS '用户性别（0男 1女 2未知）';
COMMENT ON COLUMN t_user.user_avatar IS '头像地址';
COMMENT ON COLUMN t_user.user_status IS '状态（0正常 1停用 2删除）';
COMMENT ON COLUMN t_user.user_last_login_ip IS '最后登录IP';
COMMENT ON COLUMN t_user.user_last_login_at IS '最后登录时间';
COMMENT ON COLUMN t_user.user_remark IS '备注';
COMMENT ON COLUMN t_user.created_by IS '创建者';
COMMENT ON COLUMN t_user.created_at IS '创建时间';
COMMENT ON COLUMN t_user.updated_by IS '更新者';
COMMENT ON COLUMN t_user.updated_at IS '更新时间';

# 部门表 t_dept
COMMENT ON TABLE t_dept IS '部门表';
COMMENT ON COLUMN t_dept.dept_id IS '部门ID';
COMMENT ON COLUMN t_dept.dept_parent_id IS '父部门ID';
COMMENT ON COLUMN t_dept.dept_path IS '部门路径，ltree格式';
COMMENT ON COLUMN t_dept.dept_name IS '部门名称';
COMMENT ON COLUMN t_dept.dept_status IS '状态（0正常 1停用 2删除）';
COMMENT ON COLUMN t_dept.created_by IS '创建者';
COMMENT ON COLUMN t_dept.created_at IS '创建时间';
COMMENT ON COLUMN t_dept.updated_by IS '更新者';
COMMENT ON COLUMN t_dept.updated_at IS '更新时间';

# 岗位表 t_post
COMMENT ON TABLE t_post IS '岗位表';
COMMENT ON COLUMN t_post.post_id IS '岗位ID';
COMMENT ON COLUMN t_post.post_name IS '岗位名称';
COMMENT ON COLUMN t_post.post_status IS '状态（0正常 1停用 2删除）';
COMMENT ON COLUMN t_post.post_remark IS '备注';
COMMENT ON COLUMN t_post.created_by IS '创建者';
COMMENT ON COLUMN t_post.created_at IS '创建时间';
COMMENT ON COLUMN t_post.updated_by IS '更新者';
COMMENT ON COLUMN t_post.updated_at IS '更新时间';

# 角色表 t_role
COMMENT ON TABLE t_role IS '角色表';
COMMENT ON COLUMN t_role.role_name IS '角色名称';
COMMENT ON COLUMN t_role.role_key IS '角色权限字符串';
COMMENT ON COLUMN t_role.role_status IS '角色状态（0正常 1停用 2删除）';
COMMENT ON COLUMN t_role.role_remark IS '备注';
COMMENT ON COLUMN t_role.created_by IS '创建者';
COMMENT ON COLUMN t_role.created_at IS '创建时间';
COMMENT ON COLUMN t_role.updated_by IS '更新者';
COMMENT ON COLUMN t_role.updated_at IS '更新时间';