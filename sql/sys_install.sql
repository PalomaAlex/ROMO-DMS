-- =====================
-- 启用 ltree 扩展（部门路径）
-- =====================
CREATE EXTENSION IF NOT EXISTS ltree;

-- =====================
-- 用户表 t_user
-- =====================
CREATE TABLE IF NOT EXISTS t_user (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_nickname VARCHAR(50) NOT NULL,
    user_type VARCHAR(2) DEFAULT '00',
    user_email VARCHAR(50) DEFAULT NULL,
    user_phone VARCHAR(20) DEFAULT NULL,
    user_gender CHAR(1) DEFAULT '2',
    user_avatar TEXT DEFAULT NULL,
    user_status CHAR(1) DEFAULT '0',
    user_last_login_ip VARCHAR(128) DEFAULT NULL,
    user_last_login_at TIMESTAMPTZ DEFAULT NULL,
    user_remark TEXT DEFAULT NULL,
    created_by UUID DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID DEFAULT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_t_user_user_nickname ON t_user(user_nickname);

-- 注释
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

--- 初始化 t_user 表数据，从 auth.users 复制过来
INSERT INTO public.t_user (user_id, user_nickname, user_email, created_at, updated_at)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'nickname', split_part(u.email, '@', 1)), -- 用 meta 里的 nickname，没有就取 email 前缀
    u.email,
    now(),
    now()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.t_user t WHERE t.user_id = u.id
);

--- 创建触发器函数，在 auth.users 插入新用户时同步到 t_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO public.t_user (user_id, user_nickname, user_email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
    NEW.email
);
  RETURN NEW;
END;
$function$;

--- 创建触发器，在 auth.users 插入新用户时调用上述函数
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

--- 为批量注册用户的脚本开放权限（因为 t_user 关联 auth.users，而 supabase_auth_admin 只能操作 auth.users，此时激活触发器但需要访问 public.t_user）
--- 允许 supabase_auth_admin 访问 public 的 schema
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
--- 允许 supabase_auth_admin 对 public.t_user 表的增删改查
GRANT INSERT, SELECT, UPDATE, DELETE ON TABLE public.t_user TO supabase_auth_admin;

-- =====================
-- 部门表 t_dept
-- =====================
CREATE TABLE IF NOT EXISTS t_dept (
    dept_id BIGSERIAL PRIMARY KEY,
    dept_parent_id BIGINT DEFAULT 0,
    dept_path LTREE NOT NULL DEFAULT '0',
    dept_name VARCHAR(50) NOT NULL,
    dept_status CHAR(1) DEFAULT '0',
    created_by UUID DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID DEFAULT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_t_dept_parent_id ON t_dept(dept_parent_id);
CREATE INDEX IF NOT EXISTS idx_t_dept_path_gist ON t_dept USING GIST(dept_path);

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

-- 创建触发器函数，dept_path 自动 = 父路径 + 自己的 id
create or replace function update_dept_path()
returns trigger as $$
declare
    parent_path ltree;
begin
    -- 获取父节点路径
    if NEW.dept_parent_id is null or NEW.dept_parent_id = 0 then
        parent_path := null;
    else
        select dept_path into parent_path
        from t_dept
        where dept_id = NEW.dept_parent_id;
    end if;

    -- 更新当前节点路径
    update t_dept
    set dept_path = 
        case
            when parent_path is null then NEW.dept_id::text::ltree
            else parent_path || NEW.dept_id::text
        end
    where dept_id = NEW.dept_id;

    -- 递归更新所有子孙节点
    with recursive sub_tree as (
        select dept_id, dept_parent_id, dept_path
        from t_dept
        where dept_parent_id = NEW.dept_id
        union all
        select t.dept_id, t.dept_parent_id, s.dept_path || t.dept_id::text
        from t_dept t
        join sub_tree s on t.dept_parent_id = s.dept_id
    )
    update t_dept
    set dept_path = sub_tree.dept_path
    from sub_tree
    where t_dept.dept_id = sub_tree.dept_id;

    return null; -- AFTER触发器不返回 NEW
end;
$$ language plpgsql;

--- 创建触发器，在 public.t_dept 插入或更新时自动更新 dept_path
drop trigger if exists trg_update_dept_path on t_dept;
create trigger trg_update_dept_path
after insert or update of dept_parent_id on t_dept
for each row
execute function update_dept_path();


-- =====================
-- 岗位表 t_post
-- =====================
CREATE TABLE IF NOT EXISTS t_post (
    post_id BIGSERIAL PRIMARY KEY,
    post_name VARCHAR(50) NOT NULL,
    post_status CHAR(1) DEFAULT '0',
    post_remark TEXT DEFAULT NULL,
    created_by UUID DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID DEFAULT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE t_post IS '岗位表';
COMMENT ON COLUMN t_post.post_id IS '岗位ID';
COMMENT ON COLUMN t_post.post_name IS '岗位名称';
COMMENT ON COLUMN t_post.post_status IS '状态（0正常 1停用 2删除）';
COMMENT ON COLUMN t_post.post_remark IS '备注';
COMMENT ON COLUMN t_post.created_by IS '创建者';
COMMENT ON COLUMN t_post.created_at IS '创建时间';
COMMENT ON COLUMN t_post.updated_by IS '更新者';
COMMENT ON COLUMN t_post.updated_at IS '更新时间';

-- =====================
-- 角色表 t_role
-- =====================
CREATE TABLE IF NOT EXISTS t_role (
    role_id BIGSERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    role_key VARCHAR(100) NOT NULL UNIQUE,
    role_status CHAR(1) DEFAULT '0',
    role_remark TEXT DEFAULT NULL,
    created_by UUID DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID DEFAULT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_t_role_key ON t_role(role_key);

COMMENT ON TABLE t_role IS '角色表';
COMMENT ON COLUMN t_role.role_id IS '角色ID';
COMMENT ON COLUMN t_role.role_name IS '角色名称';
COMMENT ON COLUMN t_role.role_key IS '角色权限字符串';
COMMENT ON COLUMN t_role.role_status IS '角色状态（0正常 1停用 2删除）';
COMMENT ON COLUMN t_role.role_remark IS '备注';
COMMENT ON COLUMN t_role.created_by IS '创建者';
COMMENT ON COLUMN t_role.created_at IS '创建时间';
COMMENT ON COLUMN t_role.updated_by IS '更新者';
COMMENT ON COLUMN t_role.updated_at IS '更新时间';

-- =====================
-- 用户-部门关联表 t_user_dept
-- =====================
CREATE TABLE IF NOT EXISTS t_user_dept (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    dept_id BIGINT NOT NULL,
    del_flag CHAR(1) DEFAULT '0',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, dept_id)
);

CREATE INDEX IF NOT EXISTS idx_t_user_dept_user_id ON t_user_dept(user_id);
CREATE INDEX IF NOT EXISTS idx_t_user_dept_dept_id ON t_user_dept(dept_id);

COMMENT ON TABLE t_user_dept IS '用户-部门关联表';
COMMENT ON COLUMN t_user_dept.user_id IS '用户ID';
COMMENT ON COLUMN t_user_dept.dept_id IS '部门ID';
COMMENT ON COLUMN t_user_dept.del_flag IS '删除标志（0存在 1停用 2删除）';
COMMENT ON COLUMN t_user_dept.created_at IS '创建时间';
COMMENT ON COLUMN t_user_dept.updated_at IS '更新时间';

-- =====================
-- 用户-岗位关联表 t_user_post
-- =====================
CREATE TABLE IF NOT EXISTS t_user_post (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    post_id BIGINT NOT NULL,
    del_flag CHAR(1) DEFAULT '0',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_t_user_post_user_id ON t_user_post(user_id);
CREATE INDEX IF NOT EXISTS idx_t_user_post_post_id ON t_user_post(post_id);

COMMENT ON TABLE t_user_post IS '用户-岗位关联表';
COMMENT ON COLUMN t_user_post.user_id IS '用户ID';
COMMENT ON COLUMN t_user_post.post_id IS '岗位ID';
COMMENT ON COLUMN t_user_post.del_flag IS '删除标志（0存在 1停用 2删除）';
COMMENT ON COLUMN t_user_post.created_at IS '创建时间';
COMMENT ON COLUMN t_user_post.updated_at IS '更新时间';

-- =====================
-- 用户-角色关联表 t_user_role
-- =====================
CREATE TABLE IF NOT EXISTS t_user_role (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    role_id BIGINT NOT NULL,
    del_flag CHAR(1) DEFAULT '0',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_t_user_role_user_id ON t_user_role(user_id);
CREATE INDEX IF NOT EXISTS idx_t_user_role_role_id ON t_user_role(role_id);

COMMENT ON TABLE t_user_role IS '用户-角色关联表';
COMMENT ON COLUMN t_user_role.user_id IS '用户ID';
COMMENT ON COLUMN t_user_role.role_id IS '角色ID';
COMMENT ON COLUMN t_user_role.del_flag IS '删除标志（0存在 1停用 2删除）';
COMMENT ON COLUMN t_user_role.created_at IS '创建时间';
COMMENT ON COLUMN t_user_role.updated_at IS '更新时间';
