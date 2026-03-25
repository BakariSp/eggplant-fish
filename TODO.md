# Auth / Landing / Tag-Binding Flow — Audit TODO

> 审计日期：2026-03-25（第二轮全链路重审）
> 范围：`/landing` → `/login` → `/register` → `auth-redirect` → tag 验证 → `/setup` 整条链路
> 格式：每条问题含文件位置、现象、目标、风险

---

## 目标链路（唯一正确标准）

```
/landing?id=<tagCode>
  ├─ tagCode 缺失                    → 友好提示页（不白屏）
  ├─ tag 已用 + 有 pet               → /dashboard/pets/<tagCode>/posts
  ├─ tag 已用 + 无 pet（兜底）       → 提示页 / dashboard + toast
  ├─ tag 不存在                      → 友好错误页
  └─ tag 未用
       ├─ 未登录                     → /login?redirect=/landing?id=<tag>&step=code
       │    ├─ Email 登录成功         → redirect 回 /landing?id=<tag>&step=code
       │    ├─ Google 登录成功        → redirect 回 /landing?id=<tag>&step=code
       │    └─ 点击"注册"             → /register?redirect=/landing?id=<tag>&step=code
       │         ├─ Email 注册完成    → /login?redirect=...&registered=1
       │         └─ Google 注册完成  → redirect 回 /landing?id=<tag>&step=code
       └─ 已登录                     → 直接显示 box code 输入框
              └─ 验证成功             → /setup（创建 pet）
```

---

## P1 — 必须修，边界情况断裂或严重 UX 问题

### P1-11 ｜ 匿名用户可查看 pet 主页，但权限边界未在 API 层显式声明

**文件：** `app/api/activation/verify/route.ts`、`app/api/pets/create-from-activation/route.ts`
**现象：** 业务设定为：未登录用户只能匿名查看 pet 主页（`/dashboard/pets/<tagCode>/posts`），不能执行 activation 或 create pet。当前 API 靠"无合法 session → 401"隐式实现此限制，行为正确，但没有显式文档或注释说明"匿名只读"是设计决策。未来若引入 Supabase anonymous sign-in（会产生合法 userId），两个 API 将在无任何拦截的情况下允许匿名用户 activate/create pet。
**目标：** 无需立即改代码，但若未来引入 anonymous auth，须在 API 中加 `user.is_anonymous` 检查。建议在两个 API 的 `getUserId` 逻辑旁加注释说明此边界。
**风险：** 引入 anonymous auth 时，权限边界将被无声击穿。

---

### P1-12 ｜ `0004_activation_codes.sql` migration 包含 hardcoded 测试 codes

**文件：** `supabase/migrations/0004_activation_codes.sql:17-27`
**现象：** migration 中 INSERT 了与已删除 `/api/verify-code` 相同的测试 codes（`DEF9977`, `ABC1234`, `XYZ5678` 等）。若该 migration 已 apply 到生产库，这些 codes 实际存在于 `activation_codes` 表，可被任何人用来 activate。
**目标：** 检查生产数据库，若存在这些 codes 则删除；同时清理 migration 文件中的 INSERT 语句。
**风险：** 攻击者可使用已知的测试 codes 非法激活标签。

---

### P1-01 ｜ 缺少"tag 已使用但无 pet"的兜底页面/方案

**现状：** 当 `activation_codes.is_used=true` 且 `pets.tag_code` 不存在时，没有对应 UI 路径。
**推荐方案：** 在 `/landing` 检测到此状态时，判断是否能识别当前登录用户：
- 若当前登录用户是 owner（`activation_codes.used_by = user.id`）→ redirect 到 `/setup`（可继续创建 pet）
- 若无法识别 owner 或 tag used_by 是他人 → 显示 inline 提示："This tag has already been activated. If you believe this is an error, please contact support."（不白屏，不 404）

**文件需改：** `app/landing/page.tsx`

---

### P1-09 ｜ `landing` handleVerify 不检查 `claimed` 字段 — token 竞态时 setup 必败

**文件：** `app/landing/page.tsx:197-202`
**现象：** `handleVerify` 先 `getSession()` 拿到 session，再调用 `/api/activation/verify`。如果 access_token 在两次调用之间恰好过期，API 返回 `{ success: true, claimed: false }`（验证通过但 code 未绑定到用户）。Landing 只检查 `data?.success`，看到 true 就 redirect 到 `/setup`。进入 setup 后，`loadEligibility()` 查不到 claimed code，表单提交时 API 返回 "No available activation code"（409），用户不知道发生了什么。
**目标：** 检查 `data?.claimed === true`；若 `success:true` 但 `claimed:false`，应写 `pendingActivation` + redirect 到 login 重新认证。
**风险：** token 竞态窗口时用户进入 setup 后提交必败，无明确错误提示。

---

### P1-10 ｜ `landing` handleVerify 读 `data?.data?.redirectTo` — API 契约不一致，死代码

**文件：** `app/landing/page.tsx:202`
**现象：**
```js
router.replace(data?.data?.redirectTo || "/setup");
```
`/api/activation/verify` 返回扁平结构 `{ success: true, claimed: true }`，没有 `data.data` 嵌套。`data?.data?.redirectTo` 永远是 `undefined`，始终 fallback 到 `"/setup"`。如果将来 API 真的加了 `redirectTo` 字段，代码也无法正确读取。
**目标：** 改为 `data?.redirectTo || "/setup"`。
**风险：** 与 API 契约不一致，API 扩展时静默失败。

---

## P2 — 应修，代码质量或轻微 UX 问题

### P2-05 ｜ `landing` "Connect with Google" 按钮只是跳 /login，而非直接触发 OAuth

**文件：** `app/landing/page.tsx:126-134`
**现象：** `handleGoogleConnect` 只是 `router.push('/login?redirect=...')`，用户还需要在 login 页面再次点击 Google 按钮。
**目标：** 可以直接在 landing 页触发 `supabase.auth.signInWithOAuth()`，减少一次跳转（可选优化）。

---

### P2-06 ｜ `middleware` 不保护 dashboard 路由

**文件：** `middleware.ts`
**现象：** middleware 只刷新 cookie，不检查 session。未登录用户可以直接访问 `/dashboard` 路径（客户端再判断，但有 SSR 泄露风险）。
**目标：** 视安全需求决定是否加 server-side auth guard（至少加 session 检查 + 未登录时 redirect）。

---

### P2-15 ｜ `activation/verify` 无需认证即可探测 code 存在性 — 低成本枚举向量

**文件：** `app/api/activation/verify/route.ts`
**现象：** 未认证请求可以 POST 任意 tag_code/box_code，API 返回 404（不存在）或 `{ success:true, claimed:false }`（存在但未认证）。无速率限制，攻击者可枚举有效 code 组合。
**目标：** 评估是否需要加速率限制（rate limit）或要求认证才能探测 code 有效性。
**风险：** 低成本枚举 activation codes，辅助社工或暴力破解。

---

### P2-09 ｜ `auth-redirect` 409 时不清除 `pendingActivation` — 残留数据导致反复无效 API 调用

**文件：** `app/auth-redirect.tsx:42-49`
**现象：** `/api/activation/verify` 返回 409（tag 已被 claim）时，`claimed = false`，auth-redirect **保留** `pendingActivation` 并 redirect 到 landing。每次用户再次访问 `/`，auth-redirect 都会尝试同一条 pendingActivation → 409 → redirect 到 landing，形成永久残留。Setup 页面会清理它（无论结果），但必须依赖用户进入 setup 才能清除。
**目标：** 区分"网络错误（可重试）"和"409（已 claim，无需重试）"：409 时同样清除 `pendingActivation`。
**风险：** 功能上不 broken，但每次访问 `/` 都触发无效 API 调用，体验差。

---

### P2-10 ｜ `auth-redirect` 使用 `router.push` 而非 `router.replace` — back 键触发循环跳转

**文件：** `app/auth-redirect.tsx:44, 48, 69, 84, 87`
**现象：** auth-redirect 所有跳转都用 `router.push`，history 栈增长为 `/ → /dashboard/pets`。用户按 back 键回到 `/`，再次触发 auth-redirect，再次 push，back 键完全失效。
**目标：** 所有 `router.push` 改为 `router.replace`（与 landing 的跳转方式一致）。
**风险：** 用户无法通过 back 键离开 auth-redirect 流。

---

### P2-11 ｜ `setup` auth guard redirect 不带 redirect 参数 — session 过期时用户丢失上下文

**文件：** `app/setup/page.tsx:47`
**现象：**
```js
router.replace("/login");  // 无 redirect param
```
用户在 setup 页 session 过期后，被送到 login 登录成功，login 执行默认逻辑（检查 pets → dashboard 或 setup），可能不回到 setup，用户不知道自己曾处于 setup 流程中。
**目标：** 改为 `router.replace("/login?redirect=/setup")`。
**风险：** session 过期后上下文丢失，用户体验割裂。

---

### P2-12 ｜ `landing` API 500 显示"Tag Not Recognized" — 错误语义错误

**文件：** `app/landing/page.tsx:77, 152-154`
**现象：** `fetchTagStatus` 对任何非 2xx 响应（包括 500）都 throw，orchestrate 的 `.catch()` 统一设置 `phase = "invalid-tag"`，展示"We couldn't find this tag in our system"。服务器错误被误导为"tag 不存在"。
**目标：** 区分 `!res.ok`（服务器错误）和 `!status.exists`（tag 真的不存在），分别显示不同文案（如"System error, please try again"）。
**风险：** 用户误以为自己的 tag 不合法，重复尝试或放弃，而实际是服务器临时故障。

---

### P2-13 ｜ `setup` pendingActivation fallback 无论 eligible 与否都执行 — 无用 API 调用

**文件：** `app/setup/page.tsx:60-86`
**现象：** `loadEligibility()` 返回 `eligible=true` 后，代码仍继续检查 `pendingActivation` 并尝试调用 verify（得 409），再 `removeItem`，再 `loadEligibility()`。
**目标：** 添加条件 `if (!eligible && raw)` 才尝试 claim。
**风险：** 多余 API 调用（409），无功能 bug，但有性能和逻辑清晰度问题。

---

### P2-14 ｜ `register` `success` state 从未被调用 — 死代码 UI

**文件：** `app/register/page.tsx:18, 137-140`
**现象：** `const [success, setSuccess] = useState("")` 声明了但从未调用 `setSuccess`。注册成功直接 `router.push(loginUrl)`，`{success && ...}` 的绿色 banner 永远不会显示。
**目标：** 删除 `success` state 及其对应 JSX。
**风险：** 无功能影响，代码混淆。

---

## 自检测试 Checklist（修复完成后验证）

| # | 场景 | 预期结果 |
|---|------|---------|
| 1 | 访问 `/landing?id=<usedTag>` (tag 有 pet, 未登录) | → pet 主页（无需登录） |
| 2 | 访问 `/landing?id=<usedTag>` (tag 有 pet, 已登录) | → pet 主页 |
| 3 | 访问 `/landing?id=<claimedTag>` (claimed 但无 pet, 是 owner) | → /setup |
| 4 | 访问 `/landing?id=<claimedTag>` (claimed 但无 pet, 非 owner/未登录) | → 友好提示页 |
| 5 | 访问 `/landing?id=<unusedTag>` (已登录) | → 直接显示 box code 表单 |
| 6 | 访问 `/landing?id=<unusedTag>` (未登录) → Email 登录 | → 回到 landing 表单 |
| 7 | 访问 `/landing?id=<unusedTag>` (未登录) → Google 登录 | → 回到 landing 表单 |
| 8 | 访问 `/landing?id=<unusedTag>` (未登录) → 点"create one" → Email 注册 → 登录 | → 回到 landing 表单 |
| 9 | 访问 `/landing?id=<unusedTag>` (未登录) → 点"create one" → Google 注册 | → 回到 landing 表单 |
| 10 | 访问 `/landing`（无 id 参数） | → 友好提示（非白屏） |
| 11 | 访问 `/landing?id=INVALID_TAG` | → 友好错误提示 |
| 12 | landing 页刷新（已登录 + step=code） | → box code 表单仍显示，tagCode 不丢失 |
| 13 | login/register 页刷新 | → redirect param 保持在 URL 中，不丢失 |
| 14 | token 过期后访问 /setup | → redirect 到 login |
| 15 | box code 验证成功 → /setup → 创建 pet | → /dashboard/pets/<tag>/edit |
| 16 | 重复提交同一 tag code | → 明确"already used"提示 + 兜底方案 |
| 17 | 注册成功后 login 页 | → 显示"check your email"提示（registered=1） |

---

---

## 已完成

### `fix: 修复 P0 安全漏洞（open redirect / 权限提升 / JWT 绕过）` (79809d9)

**P0-08 ｜ `register` open redirect**
`getOAuthRedirectTo()` 原本对 `http` 开头的 redirectParam 不验证 origin，允许跳转到外域。
→ 改为：相对路径直接拼 origin；绝对 URL 校验 `url.origin === window.location.origin`；外域 / 解析失败 → fallback `/dashboard/pets`。与 `login.getAbsoluteRedirect()` 行为一致。

---

**P0-09 ｜ `create-from-activation` x-user-id 权限提升**
`getUserId()` 在 Bearer token 失败后信任客户端传来的 `x-user-id` header，可被伪造。
→ 删除 `x-user-id` fallback 块（整个 `if (hintedUser)` 分支）；`setup/page.tsx` 同步删除发送该 header 的代码。userId 现在只来自 Bearer token 或 server cookie。

---

**P0-10 ｜ `/api/verify-code` JWT 不验签 + hardcoded codes**
`app/api/verify-code/route.ts` 手动 base64 decode JWT 不验签；hardcoded activation codes；大量 `console.log(token payload)`。
`app/verify/page.tsx` 是其唯一调用者，已是孤立页面。
→ 直接删除 `app/verify/page.tsx` 和 `app/api/verify-code/route.ts`。

---

### `fix: 修复 NFC tag 绑定完整认证链路` (bcf47ac)

**P0-01 ｜ `landing` 已登录用户无法进入 box code 表单**
`showForm` 初始为 `false`，"Get started" 按钮无论用户是否已登录，都执行 `router.push('/login?redirect=...')`，已登录用户永远无法看到 box code 输入框。
→ 替换为 phase 状态机，tag 未用 + 有 session → 直接 `setPhase("form")`，无需按钮。

---

**P0-02 ｜ `landing` auth guard 与 tag-pet check 并发竞争，未登录用户扫已用 tag 会乱跳**
两个 `useEffect` 同时启动，竞态条件导致未登录用户扫已绑定 tag 被送到 login 而非 pet 页面。
→ 两个 useEffect 合并为单一 orchestrator，先查 tag 状态再查 auth。

---

**P0-03 ｜ `register` Google OAuth callback 写死 `/verify?email=google`，丢失 tag 上下文**
从 landing 进入的 Google 注册用户 100% 无法完成 tag 绑定。
→ `redirectTo` 改为 `redirectParam` 的绝对 URL，回到 `/landing?id=<tag>&step=code`。

---

**P0-04 ｜ `login` "create one" 链接未透传 `redirect` 参数**
`<Link href="/register">` 不带 redirect，所有选择注册路径的用户都无法完成 tag 绑定。
→ 改为 `href={redirectParam ? \`/register?redirect=...\` : "/register"}`。

---

**P0-05 ｜ `landing` tag "已使用" 检测只查 `pets` 表，忽略 `activation_codes.is_used=true`**
tag 已 claim 但 pet 尚未创建时，用户尝试重新验证 → API 返回 409 → 卡死无路。
→ 单一 orchestrator 通过 `/api/tag/check` 同时检查两种状态。

---

**P0-06 ｜ `setup` 处理 `pendingActivation` 时未传 Authorization header，claim 静默失败**
API 无 token → 返回 `claimed:false` → 激活码未绑定 → sessionStorage 清除 → 数据永久丢失。
→ 先 `getSession()` 再加 `Authorization: Bearer <token>` header。

---

**P0-07 ｜ `landing` 无 loading 状态，已登录用户会闪见"Get started"按钮后被乱跳**
→ 添加 `checking` phase，异步检查完成前显示 spinner，不渲染任何操作 UI。

---

**P0-NEW-01 ｜ `landing` orchestrate：isUsed + !hasPet + 未登录时误判为"contact support"**
→ 在 `isUsed && !hasPet` 分支补加 `getSession()` 检查；无 session → redirect to login；有 session → 看 `isOwner`。

---

**P1-02 ｜ `register` 邮件注册后的 `emailRedirectTo` 硬编码为 `/dashboard/pets`**
→ 改为 `getOAuthRedirectTo()`，携带 landing 上下文。

---

**P1-03 ｜ `login` 页面不显示注册成功提示（`registered=1` 被忽略）**
→ 读取 `?registered=1` 并显示 banner："账号已创建！请查收验证邮件，点击链接确认后再登录。"

---

**P1-04 ｜ `auth-redirect` 处理 `pendingActivation` 失败后仍 redirect 到 `/setup`**
无论成败均删 sessionStorage 并跳 /setup，导致激活码丢失。
→ 仅在 `claimed:true` 时清除并跳 /setup；失败时保留 sessionStorage 并回 landing。

---

**P1-05 ｜ `landing` 无 tagCode 时 auth guard 直接 return，页面仍展示无意义内容**
→ 单一 orchestrator，无 tagCode → `phase = "no-tag"` → 渲染友好提示页。

---

**P1-06 ｜ `register` 页面缺少 `Suspense` 包裹**
→ `useSearchParams()` 移至内部 `RegisterForm`；`RegisterPage` 用 `<Suspense>` 包裹。

---

**P1-08 ｜ `setup` 页面无登录保护，未登录用户可直接访问**
→ `useAuth()` + useEffect guard + 早期 spinner 返回，三层防护。

---

**P2-01 ｜ `register` 密码不匹配的错误信息含 HTML entity**
→ 使用真实撇号 `"Passwords don't match"`。

---

**P2-02 ｜ `login` email 登录 redirect 未做 same-origin 校验（open-redirect 风险）**
→ 新增 `safeRedirectPath()`：拒绝 `//evil.com` 和外域，回落到 `/`。

---

**P2-03 ｜ `auth-redirect` 有 console.log 输出用户信息**
→ 删除所有 `console.log`，仅保留 `console.error` 用于异常记录。

---

**P2-04 ｜ `landing` 已登录用户无法自动看到 box code 表单**
→ Phase 状态机：tag 未用 + 有 session → 直接 `setPhase("form")`，无需任何按钮点击。

---

**P2-07 ｜ `verify` 页面孤立（standalone activation code 流程与 tag+box 绑定流程混淆）**
→ P0-03 修复时 register 停止路由到 `/verify`，该页面已成死页面。（完整删除见 P0-10 待办）

---

### `fix: 放宽 activation 校验为 tag/box 独立存在即可通过` (4655551)

**~~P1-07~~ ｜ `activation/verify` API：box_code 与 tag_code 独立校验 — 符合业务设计，非 bug**
业务逻辑是 tag 和 box 只要各自在数据库中存在即可通过，不要求配对在同一行。两次独立查询是正确实现。已确认，无需修改。
