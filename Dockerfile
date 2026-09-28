# syntax=docker/dockerfile:1
# Leo Tree public web build. Knowledge stays in the visitor's browser; the server
# only serves the app and, when LEOTREE_EMAIL_AUTH=true, an optional account store.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# VITE_AUTH_ENABLED is a build-time flag baked into the client bundle.
ARG VITE_AUTH_ENABLED=true
ENV VITE_AUTH_ENABLED=$VITE_AUTH_ENABLED
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3008 NITRO_PORT=3008
RUN addgroup -S leotree && adduser -S leotree -G leotree \
    && mkdir -p /var/lib/leotree && chown leotree:leotree /var/lib/leotree
# The Nitro output is self-contained (PGLite and its WASM are traced into .output/server/node_modules).
COPY --from=build --chown=leotree:leotree /app/.output ./.output
USER leotree
VOLUME ["/var/lib/leotree"]
EXPOSE 3008
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3008/api/auth/capabilities >/dev/null || exit 1
CMD ["node", ".output/server/index.mjs"]
