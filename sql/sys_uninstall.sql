-- =====================
-- 卸载中间表
-- =====================
DROP TABLE IF EXISTS t_user_role CASCADE;
DROP TABLE IF EXISTS t_user_post CASCADE;
DROP TABLE IF EXISTS t_user_dept CASCADE;

-- =====================
-- 卸载主表
-- =====================
DROP TABLE IF EXISTS t_role CASCADE;
DROP TABLE IF EXISTS t_post CASCADE;
DROP TABLE IF EXISTS t_user CASCADE;
DROP TABLE IF EXISTS t_dept CASCADE;

-- =====================
-- ltree 扩展仅在确认不再使用时卸载
-- =====================
-- DROP EXTENSION IF EXISTS ltree;

-- 删除旧触发器和函数
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop trigger if exists trg_update_dept_path on t_dept;
drop function if exists update_dept_path();