# Exam Practice System（刷题系统）

轻量级在线刷题系统，支持套题练习、答题记录保存、继续练习与历史成绩查看。

## 技术栈

- Next.js 15 (App Router)
- TypeScript
- TailwindCSS
- Prisma + PostgreSQL (Neon)
- shadcn/ui 风格组件

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置数据库

复制环境变量文件并填入 Neon PostgreSQL 连接字符串：

```bash
cp .env.example .env
```

`.env` 示例：

```
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

### 3. 初始化数据库

```bash
npm run db:push
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 部署到 Vercel

1. 将项目推送到 GitHub
2. 在 Vercel 导入项目
3. 在 Vercel 环境变量中设置 `DATABASE_URL`
4. 部署完成后运行 `prisma db push`（或通过 Vercel 构建命令自动执行 `prisma generate`）

构建命令已配置为：

```bash
prisma generate && next build
```

## 项目结构

```
src/
├── app/                  # 页面与 API Routes
│   ├── api/              # Route Handlers
│   ├── practice/         # 答题页
│   └── result/           # 结果页
├── components/           # UI 组件
├── hooks/                # 客户端 Hooks
├── lib/                  # 工具与 Prisma
└── types/                # TypeScript 类型
data/
└── question-bank.json    # 题库数据
prisma/
└── schema.prisma         # 数据库模型
```

## 功能说明

- **用户名登录**：首次访问输入用户名，数据存入数据库，换浏览器输入相同用户名即可恢复进度
- **自动保存**：选择答案后立即写入数据库
- **继续练习**：自动恢复上次答题进度
- **历史记录**：首页展开套题可查看历次成绩
- **成绩统计**：完成试卷后自动计算正确率
