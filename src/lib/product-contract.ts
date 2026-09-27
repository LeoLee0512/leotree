import type { Locale } from "./i18n";

export const APP_VERSION = "1.0.0-beta.4";

export const PROGRESS_CONTRACT = "这是当前知识节点清单的自报加权学习进度：(掌握数 + 0.4 × 在学数) ÷ 全部节点数。每个节点同权，含父节点；优先级不改变权重。它不代表能力、掌握概率、考试成绩或学习时长。新增节点可能使百分比下降，这不意味着学习退步。";
const PROGRESS_CONTRACT_EN = "This is the self-reported weighted learning progress of the current node list: (mastered + 0.4 × learning) ÷ all nodes. Every node counts equally, parents included; priority does not change the weight. It does not measure ability, probability of mastery, exam results or study time. Adding nodes can lower the percentage, which is not a setback.";

/** The nine user-facing answers; the settings page and the download page show the same list. */
export const USER_GUIDE = [
  ["我的数据存在哪里？", "知识文字与结构保存在当前浏览器的本机存储中，附件字节在 IndexedDB。它们按网站地址与浏览器资料分开；清除网站数据或使用临时浏览模式可能丢失数据，请定期下载完整备份。"],
  ["登录是否意味着云同步？", "不意味着。账号仅用于身份登录，知识仍在本机。同一浏览器切换账号仍使用同一个本机空间，不会上传、同步、隔离或转移知识。"],
  ["JSON 导出包含什么？", "树、分区、节点、笔记、状态、历史、复盘、实践及附件元数据；不包含附件字节。它是 JSON 导出，不能代替完整备份。"],
  ["完整备份包含什么？", "ZIP 包含知识工作区、附件字节、仍保留的本地园子资料与封面、版本清单和 SHA-256 校验。恢复前先校验并预览，再确认替换。它不备份登录凭据、浏览器偏好或账号数据库。"],
  ["复制一棵 Tree 后是否独立？", "是。副本使用新树 ID、新附件 ID，并实际复制字节；修改或删除副本附件不会损坏原件。"],
  ["附件存在哪里？", "在当前网站的 IndexedDB 中；本版支持 PNG、Markdown、PDF、DOCX，每个文件不超过 10MB。上传成功后会随知识一起保存，请用完整备份带走文件。"],
  ["进度百分比是什么意思？", PROGRESS_CONTRACT],
  ["重置学习状态会删除什么？", "把当前状态改为未学并清空当前状态计时，保留笔记、实践、复盘、附件、结构及历史事件与首次完成证据。删除整棵树是另一个需要确认的操作。"],
  ["Community 当前是什么状态？", "Preview，暂未开放。本版不提供社区发布、评论或创建园子；旧本地资料仍保留在备份中。"],
] as const;

const USER_GUIDE_EN = [
  ["Where is my data?", "Knowledge text and structure live in this browser's local storage; attachment bytes live in IndexedDB. They are separated by site address and browser profile. Clearing site data or using a private window can lose them, so download full backups regularly."],
  ["Does signing in mean cloud sync?", "No. An account only identifies you; knowledge stays on this device. Switching accounts in the same browser keeps the same local workspace and never uploads, syncs, partitions or moves knowledge."],
  ["What does the JSON export contain?", "Trees, sections, nodes, notes, states, history, reviews, practice logs and attachment metadata, but no attachment bytes. It is an export, not a replacement for a full backup."],
  ["What does the full backup contain?", "The ZIP holds the workspace, attachment bytes, any retained local garden data and covers, a version manifest and SHA-256 checksums. It is verified and previewed before you confirm a restore. It does not back up sign-in credentials, browser preferences or the account database."],
  ["Is a copied tree independent?", "Yes. The copy gets a new tree ID, new attachment IDs and its own copy of the bytes; editing or deleting the copy's attachments never harms the original."],
  ["Where are attachments stored?", "In this site's IndexedDB. This version accepts PNG, Markdown, PDF and DOCX up to 10MB each. Once uploaded they are saved with the knowledge; use the full backup to take the files with you."],
  ["What does the progress percentage mean?", PROGRESS_CONTRACT_EN],
  ["What does resetting the learning state delete?", "It sets every node back to not started and clears the current-state timer. Notes, practice, reviews, attachments, structure, history events and first-completion evidence are kept. Deleting a whole tree is a separate confirmed action."],
  ["What is the state of Community?", "Preview, not open yet. This version offers no publishing, comments or garden creation; older local data stays in your backups."],
] as const;

export function userGuide(locale: Locale): ReadonlyArray<readonly [string, string]> {
  return locale === "en" ? USER_GUIDE_EN : USER_GUIDE;
}

export function progressContract(locale: Locale): string {
  return locale === "en" ? PROGRESS_CONTRACT_EN : PROGRESS_CONTRACT;
}
