# Docker 部署：tree.leomath.cn

Leo Tree 与 LeoMath 部署在同一台阿里云 ECS 上。LeoMath 占用 `leomath.cn`，Leo Tree 使用子域名 `tree.leomath.cn`；两者共用主机上的 nginx，按 `server_name` 区分，各自用 Let's Encrypt 域名证书。**不再使用裸 IP 和 IP 证书**，也不再用 systemd 直接跑 Node；旧的 `deploy/leotree.service`、`deploy/leotree.nginx.conf`、`deploy/activate.sh` 与 `docs/ECS_DEPLOYMENT.md` 仅作历史记录。

## 前提

1. 云解析里为 `leomath.cn` 添加 A 记录：主机记录 `tree`，指向服务器公网 IP。
2. 服务器上已有 Docker（LeoMath 部署时已装）和 nginx。
3. 备案：`tree.leomath.cn` 是 `leomath.cn` 的子域名，主域名备案通过后子域名可直接使用。

## 首次部署

```bash
git clone https://github.com/LeoLee0512/leotree.git /opt/leotree-docker
cd /opt/leotree-docker

# 环境变量：只需要一个随机密钥
printf 'BETTER_AUTH_SECRET=%s\n' "$(openssl rand -hex 32)" > .env
chmod 600 .env

# 构建并启动（首次约 2–3 分钟）
docker compose up -d --build
curl -s http://127.0.0.1:3008/api/auth/capabilities   # 有 JSON 返回即正常

# nginx
sudo cp deploy/leotree.tree.leomath.nginx.conf /etc/nginx/conf.d/tree.leomath.conf
sudo nginx -t && sudo systemctl reload nginx

# HTTPS
sudo certbot --nginx -d tree.leomath.cn
```

打开 https://tree.leomath.cn/ 应看到首页；`/download` 是版本与下载页。

## 环境变量

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | 必填 | 至少 32 字节的随机值，写在 `.env` |
| `BETTER_AUTH_URL` | `https://tree.leomath.cn` | 站点公网地址 |
| `LEOTREE_EMAIL_AUTH` | `false` | 设为 `true` 才显示邮箱密码登录；账号库存于容器卷 `leotree-data` |
| `TREE_PORT` | `3008` | 只在 127.0.0.1 上发布，不对公网开放 |

`VITE_AUTH_ENABLED` 是构建期参数，`docker-compose.yml` 固定为 `true`，与之前线上版本一致。

## 更新

```bash
cd /opt/leotree-docker && git pull && docker compose up -d --build
```

## 用户数据

知识按浏览器 origin 保存。从旧地址（`https://8.130.33.10/` 或本机）迁移的用户，需要先在旧地址下载**完整备份 ZIP**，再到 `https://tree.leomath.cn/` 恢复；服务器不保存、也不能迁移他们的知识。

## 排错

- `docker compose logs -f tree`：应用日志。
- 502：容器未启动或健康检查失败，`docker compose ps`。
- nginx 欢迎页或跳到 LeoMath：`tree.leomath.conf` 未加载或 `server_name` 写错，`nginx -T | grep server_name`。
