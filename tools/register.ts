// # npx 写法（npm）
// npx ts-node register.ts

// # pnpm 写法
// pnpm dlx ts-node register.ts

// 在supabase的 SQL编辑器中执行以下SQL，删除测试用户：
// delete from auth.users where email = 'debug@example.com';
// 彻底清理关联数据：
// delete from auth.identities where user_id not in (select id from auth.users);
// delete from auth.sessions where user_id not in (select id from auth.users);


// 批量注册用户脚本
import 'dotenv/config'; // 需要 pnpm add dotenv -D(-D 表示仅开发环境安装)
import { createClient } from "@refinedev/supabase";

const SUPABASE_URL = "http://127.0.0.1:8000";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU0NjY4ODAwLCJleHAiOjE5MTI0MzUyMDB9.09FdJgnpvRo4BioL3-KcFlbg6BZAtAtHPIm14XhQTr0";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTQ2Njg4MDAsImV4cCI6MTkxMjQzNTIwMH0.89tZaNZkuDMqISvi1_5wPjM61ZmsIqj0jkv3M7nfHDA";

// 1️⃣ 初始化 Supabase Admin 客户端
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }, // 管理操作不需要持久化
});

// 2️⃣ 定义用户数组
const users = [
  { email: 'user1@example.com', password: '123456' },
  { email: 'user2@example.com', password: '123456' },
  { email: 'user3@example.com', password: '123456' },
];

// 3️⃣ 批量创建
for (const user of users) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true, // 自动验证邮箱（可选）
  });

  if (error) {
    console.error(`❌ Failed to create ${user.email}:`, error.message);
  } else {
    console.log(`✅ Created: ${data.user.email}`);
  }
}

console.log('🎉 Batch registration complete.');
