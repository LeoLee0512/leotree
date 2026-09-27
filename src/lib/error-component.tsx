import type { ErrorComponentProps } from "@tanstack/react-router";

/** Route-level error page in the product's own paper-and-ink style. */
export function AppErrorComponent({ error }: ErrorComponentProps) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    <main className="wrap error-page">
      <p className="brand-mark">LEO TREE</p>
      <h1>页面出错了</h1>
      <p>本机知识没有被修改。可以刷新页面重试；如果反复出现，请先在设置页下载完整备份。</p>
      {message ? (
        <details className="error-details">
          <summary>查看排查信息</summary>
          <pre>{message}</pre>
        </details>
      ) : null}
      <a className="btn" href="/">返回首页</a>
    </main>
  );
}
