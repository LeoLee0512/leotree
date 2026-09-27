#!/usr/bin/env bash
# Run as root after uploading an independently SHA256-verified .output archive.
#   bash /opt/leotree/deploy/activate.sh <release-directory-name> [public-host]
# public-host (IP or domain) is only needed the first time, to write /etc/leotree.env
# and the nginx site; later runs keep the existing configuration.
set -euo pipefail
release="${1:?versioned release directory name required}"
[[ "$release" =~ ^[a-zA-Z0-9._-]+$ ]] || exit 2
test -f "/opt/leotree/releases/$release/server/index.mjs"
deploy_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

id leotree >/dev/null 2>&1 || useradd --system --home /var/lib/leotree --shell /usr/sbin/nologin leotree
install -d -o leotree -g leotree -m 700 /var/lib/leotree
install -d -m 755 /opt/leotree/backups

if [ ! -f /etc/leotree.env ]; then
    host="${2:?public host (IP or domain) required on first activation}"
    umask 077
    {
        printf '%s\n' 'NODE_ENV=production' 'HOST=127.0.0.1' 'PORT=3008' 'NITRO_PORT=3008' \
            'LEOTREE_EMAIL_AUTH=false' "BETTER_AUTH_URL=https://$host" 'DATABASE_URL=' \
            'LEOTREE_PGLITE_PATH=/var/lib/leotree/platform-db'
        printf 'BETTER_AUTH_SECRET=%s\n' "$(openssl rand -hex 32)"
    } > /etc/leotree.env
fi

chown -R root:root "/opt/leotree/releases/$release"
chmod -R a+rX "/opt/leotree/releases/$release"
if [ -L /opt/leotree/current ]; then
    readlink -f /opt/leotree/current > /opt/leotree/backups/previous-release.txt
fi
ln -s "/opt/leotree/releases/$release" /opt/leotree/current.next
mv -Tf /opt/leotree/current.next /opt/leotree/current

install -m 644 "$deploy_dir/leotree.service" /etc/systemd/system/leotree.service
install -m 644 "$deploy_dir/leotree-cert-renew.service" /etc/systemd/system/leotree-cert-renew.service
install -m 644 "$deploy_dir/leotree-cert-renew.timer" /etc/systemd/system/leotree-cert-renew.timer
systemctl daemon-reload
systemctl enable --now leotree
systemctl restart leotree
for attempt in $(seq 1 30); do
    if curl --noproxy '*' --fail --silent http://127.0.0.1:3008/api/auth/capabilities >/dev/null; then break; fi
    sleep 1
done
curl --noproxy '*' --fail --silent http://127.0.0.1:3008/api/auth/capabilities

if [ ! -f /etc/nginx/sites-available/leotree ]; then
    host="${2:?public host (IP or domain) required on first activation}"
    sed "s/LEOTREE_HOST/$host/g" "$deploy_dir/leotree.nginx.conf" > /etc/nginx/sites-available/leotree
fi
ln -sfn /etc/nginx/sites-available/leotree /etc/nginx/sites-enabled/leotree
nginx -t
systemctl reload nginx
systemctl enable --now leotree-cert-renew.timer
systemctl is-active leotree nginx leotree-cert-renew.timer
