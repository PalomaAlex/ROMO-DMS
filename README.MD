# romo-vite

## volta 管理当前项目的node


## 添加资源 手脚架
```bash
pnpm run refine create-resource 资源包名称
```
该命令将会在 src/pages 下创建包含CRUD的资源文件并开放接口，同时在 App.tsx 中导入资源

其代码用到的组件，需要进行安装
```bash
npm install @refinedev/react-table @refinedev/react-hook-form 
npm install @refinedev/inferencer
```

## 导出官方资源 可以在官方资源基础上进行自定义
```bash
npm run refine swizzle
```
可以使用任意包管理器进行这个操作


## Available Scripts

### Running the development server.

```bash
    pnpm dev
    pnpm dev -- --host
```

### Building for production.

```bash
    pnpm build
```

### Running the production server.

```bash
    pnpm start
```

## Learn More

[ant 图标资源](https://ant.design/components/icon/)

To learn more about **Refine**, please check out the [Documentation](https://refine.dev/docs)

- **Supabase Data Provider** [Docs](https://refine.dev/docs/core/providers/data-provider/#overview)
- **Ant Design** [Docs](https://refine.dev/docs/ui-frameworks/antd/tutorial/)
- **React Router** [Docs](https://refine.dev/docs/core/providers/router-provider/)

## License

MIT
