# Leo Tree

Leo Tree 是保存和整理个人知识树的本机应用。围绕「查找 → 记录 → 实践 → 回顾 → 返回节点 → 修整结构」工作，保留纸墨视觉、「我的 / 社区 / 设置」导航和 SNN 模板。知识只保存在当前浏览器，服务器不接触知识内容。

当前版本见 `package.json`（`1.0.0-beta.4`）。变更记录在 [docs/CHANGELOG.md](docs/CHANGELOG.md)，架构在 [ARCHITECTURE.md](ARCHITECTURE.md)，产品方向在 [PRODUCT_VISION.md](PRODUCT_VISION.md)，服务器运维在 [docs/ECS_DEPLOYMENT.md](docs/ECS_DEPLOYMENT.md)。RC1 与 Public Beta 的历史报告收在 [docs/history/](docs/history/)。

## 启动

需要 Node.js 22 或更新版本。

```sh
npm ci
npm run build
npm run test:build
npm start
```

访问 **http://localhost:8080**，选择「立即使用网页版」或完成三屏引导。开发模式是 `npm run dev`（同样监听 127.0.0.1:8080）。启动前确认端口未被占用。

知识按浏览器资料和网站 origin 保存；更换端口、localhost / 127.0.0.1 或浏览器都会进入不同空间。切换地址前先下载完整备份，再到新地址恢复。

便携运行包（`.output/` 目录）只需 Node.js，在包根目录执行 `node --env-file-if-exists=.env.local server/index.mjs`。默认监听 127.0.0.1:8080，可用 `HOST`、`PORT` 覆盖。

## 账号可选

默认只提供本机空间，不显示未配置的账号表单。需要本机邮箱密码登录时，先停止服务，在源码根目录执行：

```sh
npm run setup:account
npm start
```

脚本仅在 `.env.local` 不存在时创建配置，生成随机稳定密钥，账号数据库保存到 `.local/account-db`。保护这些文件，不要提交或公开分享。账号配置不需要重新构建，只需重启服务；只有配置与数据库探测都通过时才显示表单。

账号仅代表登录身份。**登录不会把本机知识同步到云端；同一浏览器空间不按账号隔离。** 没有邮箱验证、找回密码或第三方登录。

## 数据与恢复

[USER_GUIDE.md](USER_GUIDE.md) 和设置页提供相同的九项说明。JSON 只导出知识结构与元数据；携带附件必须用**完整备份 ZIP**，包含 SHA-256 清单、工作区、实际附件及保留的旧园子资源，不含账号数据库、登录凭据和浏览器偏好。

读取异常进入恢复页，保留源数据。先下载原文或救援包，再预览、确认候选副本。保存失败保留内存草稿；关闭页面前完成重试或救援导出。导入默认创建独立新树，覆盖或合并必须查看冲突并确认。详见 [数据安全协议](docs/DATA_SAFETY_PROTOCOL.md)。

## 复验

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:build
npm run test:browser:production
```

`npm test` 依次运行产品测试（`src/lib/**/*.test.ts`）和工具脚本测试（`scripts/*.test.mjs`）。浏览器脚本使用已安装的 Chrome，启动独立生产服务（端口 8082、8083），使用合成数据、独立浏览器资料和临时账号数据库，不会连接个人账号。结果、截图、运行资料与临时凭据写入已忽略的 `release-evidence/`（历史验收产物在 git 历史中仍可取回，例如 `git show a5cb382:release-evidence/<路径>`）。

已有服务的单独检查是 `npm run test:browser:data` 和 `npm run test:browser:learning`，默认目标 http://localhost:8080；`RC_URL` 可指定其他实例，`RC_TEST_PORT_BASE` 可改验收端口，`RC_SERVER_ROOT` 可指向独立解压的运行包根目录。测试说明见 [tests/README.md](tests/README.md)。

## 目录

- `src/lib/knowledge-tree/` 领域层：类型、纯函数引擎、命令服务、存储、迁移、导入、备份、附件。
- `src/components/kt/` 界面。`src/lib/i18n.tsx` 中英文案。
- `src/lib/auth/`、`src/lib/db.ts`、`migrations/` 可选的本机账号。
- `scripts/` 测试运行器、构建检查、浏览器验收、账号初始化。
- `deploy/` systemd、nginx 与激活脚本。
- `templates/` 标准空白树 JSON。`public/theme/` 视觉素材。

反馈入口目前只复制反馈提纲，不发送内容；获得真实 HTTPS 反馈地址后设置 `VITE_FEEDBACK_URL` 并重新构建。
