import type { Locale } from "./i18n";

/** Plain-language explanations for storage/recovery error codes. Never expose the enum itself. */
const ZH: Record<string, string> = {
  SAVE_FAILED: "这次修改还没保存。内容仍留在本页，请重试，或先下载草稿再离开。",
  QUOTA_EXCEEDED: "当前浏览器的可用空间不足。请先下载草稿和附件，再释放设备空间后重试。",
  STORAGE_ERROR: "暂时无法读写当前浏览器的存储。请先保留草稿，并检查网站的存储权限。",
  COORDINATION_UNAVAILABLE: "当前浏览器或打开方式不支持安全保存。请使用最新版浏览器打开 HTTPS 网站；已有草稿可以先下载。",
  CLEANUP_DEFERRED: "知识已经保存，旧附件的清理暂未完成。你可以继续使用，稍后重试清理。",
  CONFLICT: "其他页面已修改了这份内容。你的草稿仍在，请先下载保留，再读取最新内容核对。",
  RECOVERY_REQUIRED: "暂时无法打开这份知识。原始内容没有被替换，请先保留一份，再选择恢复副本。",
  PARSE_ERROR: "这份数据暂时读不出来，可能不完整。原始内容仍然保留。",
  UNSUPPORTED_VERSION: "这份数据来自暂不支持的版本。请保留原件，使用对应版本打开或导入兼容的备份。",
  SCHEMA_INVALID: "这份文件缺少必要的知识内容，暂时不能使用。请检查是否选对了导出文件。",
  RELATION_INVALID: "这份数据的节点关系不完整，暂时不能安全打开。请保留原件，尝试另一份完整备份。",
  CONFIRMATION_REQUIRED: "恢复前需要明确选择采用导入内容。请先查看差异，再勾选确认。",
  ATTACHMENTS_REQUIRED: "这份 JSON 没有携带附件文件。请使用完整 ZIP，或明确选择只导入知识内容。",
  FILE_MISSING: "有附件暂时无法读取。请保留当前内容，尝试原设备上的完整备份。",
  MISSING_ATTACHMENT: "有附件暂时无法读取。请保留当前内容，尝试原设备上的完整备份。",
  HASH_MISMATCH: "这份备份的内容与它的校验清单不一致，可能已损坏。请尝试另一份完整备份。",
  FILE_UNSUPPORTED: "暂不支持这个文件。请使用 PNG、Markdown、PDF 或 DOCX。",
  FILE_TOO_LARGE: "这个附件超过 10MB，请缩小文件后重试。",
};
const ZH_DEFAULT = "这次操作暂未完成。已有知识仍保留，请先下载需要保留的草稿，再重试。";

const EN: Record<string, string> = {
  SAVE_FAILED: "This change is not saved yet. It stays on this page; retry, or download the draft before leaving.",
  QUOTA_EXCEEDED: "This browser is out of storage space. Download the draft and attachments, free up space, then retry.",
  STORAGE_ERROR: "This browser's storage cannot be read or written right now. Keep the draft and check the site's storage permission.",
  COORDINATION_UNAVAILABLE: "This browser or the way the page was opened cannot save safely. Use a current browser on an HTTPS site; an existing draft can be downloaded first.",
  CLEANUP_DEFERRED: "The knowledge is saved, but old attachments were not cleaned up yet. Keep working and retry the cleanup later.",
  CONFLICT: "Another page changed this content. Your draft is kept; download it, then load the latest content to compare.",
  RECOVERY_REQUIRED: "This knowledge cannot be opened right now. The original content was not replaced; keep a copy, then choose a recovery candidate.",
  PARSE_ERROR: "This data cannot be read and may be incomplete. The original content is kept.",
  UNSUPPORTED_VERSION: "This data comes from an unsupported version. Keep the original and open it with the matching version or import a compatible backup.",
  SCHEMA_INVALID: "This file lacks the required knowledge content and cannot be used. Check that the right export was chosen.",
  RELATION_INVALID: "The node relations in this data are incomplete, so it cannot be opened safely. Keep the original and try another full backup.",
  CONFIRMATION_REQUIRED: "Restoring requires explicitly choosing the imported content. Review the differences, then tick the confirmation.",
  ATTACHMENTS_REQUIRED: "This JSON carries no attachment files. Use the full ZIP, or explicitly import knowledge only.",
  FILE_MISSING: "Some attachments cannot be read. Keep the current content and try the full backup from the original device.",
  MISSING_ATTACHMENT: "Some attachments cannot be read. Keep the current content and try the full backup from the original device.",
  HASH_MISMATCH: "This backup does not match its own checksum manifest and may be damaged. Try another full backup.",
  FILE_UNSUPPORTED: "This file type is not supported. Use PNG, Markdown, PDF or DOCX.",
  FILE_TOO_LARGE: "This attachment is over 10MB. Reduce the file and retry.",
};
const EN_DEFAULT = "This action did not complete. Existing knowledge is kept; download any draft you need, then retry.";

export function userMessage(code: string | null | undefined, locale: Locale = "zh"): string {
  const table = locale === "en" ? EN : ZH;
  return table[code ?? ""] ?? (locale === "en" ? EN_DEFAULT : ZH_DEFAULT);
}

export function errorMessage(error: unknown, locale: Locale = "zh"): string {
  if (error instanceof SyntaxError) return userMessage("PARSE_ERROR", locale);
  return userMessage(error && typeof error === "object" && "code" in error ? String(error.code) : null, locale);
}

const CONFLICT_ZH: Record<string, string> = { "same-tree": "同一棵树", "same-node": "同一个节点", newer: "导入内容较新或不同", older: "导入内容较旧", structure: "结构不同", attachment: "附件不同" };
const CONFLICT_EN: Record<string, string> = { "same-tree": "Same tree", "same-node": "Same node", newer: "Imported content is newer or different", older: "Imported content is older", structure: "Structure differs", attachment: "Attachments differ" };

export function conflictLabel(kind: string, locale: Locale = "zh"): string {
  return (locale === "en" ? CONFLICT_EN : CONFLICT_ZH)[kind] ?? kind;
}
