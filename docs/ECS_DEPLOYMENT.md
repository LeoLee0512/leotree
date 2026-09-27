# ECS 部署与维护

公网地址：https://8.130.33.10/ 。线上版本、部署日期和运行目录记录在本文末尾的「上线记录」，每次激活新版本后追加一行。

## 布局

- 系统：Ubuntu 22.04，Node.js 24（官方 SHA256 核对后安装），安装目录通过符号链接 `/opt/leotree/node` 引用。
- 应用：`/opt/leotree/releases/<版本目录>`；`/opt/leotree/current` 符号链接指向当前运行版本。
- 用户：`leotree`；systemd 服务 `leotree`，只监听 127.0.0.1:3008；开机启动、失败重启。
- 服务配置：`/etc/systemd/system/leotree.service`；环境文件 `/etc/leotree.env`（root-only，包含随机服务密钥，不写入代码或交付包）。
- 运行数据：`/var/lib/leotree`。公开邮箱注册默认关闭（`LEOTREE_EMAIL_AUTH=false`）；知识和附件只在用户浏览器里。
- Nginx：`/etc/nginx/sites-available/leotree`；80 只保留 ACME 验证，其余转 HTTPS；443 终止 TLS 后转发本机应用，并加上 HSTS、CSP（仅同源资源）、`X-Frame-Options`、`Referrer-Policy` 等响应头。
- 部署源配置在仓库 `deploy/`：`leotree.service`、`leotree-cert-renew.service`、`leotree-cert-renew.timer`、`leotree.nginx.conf`、`activate.sh`。

## 首次或更新部署

1. 本机构建并检查：`npm ci && npm run build && npm run test:build`。
2. 把 `.output/` 打包为独立归档（Linux/macOS 用 `tar -czf`；Windows 也用 `tar`，`Compress-Archive` 会写入反斜杠路径），记录 SHA256。
3. 上传归档和仓库 `deploy/` 目录到服务器，核对 SHA256，解包到一个新的版本目录，不要覆盖旧目录。
4. 执行 `bash /opt/leotree/deploy/activate.sh <版本目录名> [公网主机]`。公网主机（IP 或域名）只在首次激活时需要，用于生成 `/etc/leotree.env` 和 nginx 站点；之后保留现有配置。脚本会创建用户和目录、切换 `current`、安装 systemd 单元、重启服务、等待 `/api/auth/capabilities` 返回、写入并启用 nginx 站点、启用证书续期定时器。
5. 验证服务、HTTPS 和浏览器功能（例如 `RC_URL=https://<主机> npm run test:browser:data`），然后在下方追加上线记录。

## 回退

更新前 `current` 的目标写入 `/opt/leotree/backups/previous-release.txt`。回退到一个确实存在且验证过的旧目录：

```sh
old_release=/opt/leotree/releases/<已验证的旧版本目录>
test -f "$old_release/server/index.mjs"
ln -s "$old_release" /opt/leotree/current.rollback
mv -Tf /opt/leotree/current.rollback /opt/leotree/current
systemctl restart leotree
curl --noproxy '*' --fail http://127.0.0.1:3008/api/auth/capabilities
```

需要整体撤下部署时，先停止 `leotree`，再从备份还原原 Nginx 站点，`nginx -t` 后 reload；保留版本包和运行数据，不要动用户浏览器里的知识。

## IP 证书续期

Let's Encrypt IP SAN 证书路径 `/etc/letsencrypt/live/<主机>/`，使用 Certbot 的 shortlived 配置，有效期短，必须自动续期（参考 [Let's Encrypt 官方说明](https://letsencrypt.org/2026/03/11/shorter-certs-certbot)）。`leotree-cert-renew.timer` 每六小时运行一次，最多五分钟随机延迟，`Persistent=true`；续期成功后 `systemctl reload nginx`。服务器原有代理环境指向不可用地址，Certbot 单元单独清空代理变量。80 端口的 ACME 路径需要长期开放。

维护检查（服务器 root）：

```sh
systemctl status leotree leotree-cert-renew.timer --no-pager
systemctl list-timers leotree-cert-renew.timer --no-pager
journalctl -u leotree -u leotree-cert-renew.service --since today --no-pager
nginx -t
```

## 用户数据迁移

localhost、公网 IP、未来域名是不同的浏览器来源。到旧地址下载完整 ZIP，再到新地址恢复；不会自动上传或同步。完整 ZIP 不含账号数据库或浏览器偏好，因此首次提示与上次备份时间也不跨地址迁移。

## 上线记录

| 日期 | 版本 / 提交 | 运行目录 | 备注 |
| --- | --- | --- | --- |
| 2026-09-05 | 1.0.0-beta.1 / cc8ba79 | `beta1-20260905` | 首次公网上线；放行 443 后直接 HTTPS 验证通过，证据见 docs/history |
| 2026-09-08 | 1.0.0-beta.2 / 750937f | `leotree-beta2-20260908` | 幽灵控件、分区命名弹窗、全年进度、标准空白模板、下载页间距 |
| 2026-09-08 | 1.0.0-beta.3 / b81bc13 | `leotree-beta3-20260908` | LaTeX 公式（KaTeX），数据模型无改动；公网 `scripts/math-check.mjs` 6/6 通过 |

beta.4（本仓库当前代码）尚未部署：它移除了第三方脚本注入与平台身份网关，nginx 配置与 `activate.sh` 也已更新，首次激活时需要传入公网主机参数，并重新生成 nginx 站点文件（旧站点文件不含新的响应头）。
