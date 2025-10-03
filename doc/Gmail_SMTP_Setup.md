# Gmail SMTP 邮件发送配置指南

## 📧 Gmail 账户准备

### 1. 启用两步验证
1. 访问 [Google 账户安全设置](https://myaccount.google.com/security)
2. 在"登录 Google"部分，启用"两步验证"
3. 按照指引完成手机验证

### 2. 生成应用专用密码
1. 在两步验证启用后，返回安全设置页面
2. 点击"应用专用密码"
3. 选择应用："邮件"，选择设备："其他（自定义名称）"
4. 输入名称（如"EGGPLANT.FISH"）
5. 复制生成的 16 位密码（格式：xxxx xxxx xxxx xxxx）

## 🔧 环境变量配置

在项目根目录的 `.env.local` 文件中添加：

```bash
# Gmail SMTP 配置
GMAIL_SMTP_USER=your-email@gmail.com
GMAIL_SMTP_PASSWORD=your-16-digit-app-password
GMAIL_SMTP_FROM=your-email@gmail.com

# 应用配置
NEXT_PUBLIC_APP_NAME=EGGPLANT.FISH
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 注意事项
- `GMAIL_SMTP_PASSWORD` 使用应用专用密码，不是 Gmail 登录密码
- 移除密码中的空格，输入为连续16位字符
- `GMAIL_SMTP_FROM` 可以省略，默认使用 `GMAIL_SMTP_USER`

## 🚀 启动和测试

### 1. 重启开发服务器
```bash
# 停止当前服务器 (Ctrl+C)，然后重启
npm run dev
```

### 2. 测试邮件发送
1. 访问宠物页面（如：`http://localhost:3000/dashboard/pets/[pet-id]/posts`）
2. 点击右上角的 "Lost" 按钮
3. 确认对话框中点击 "Continue"
4. 检查控制台日志：
   - ✅ 成功：`[notify] Email sent successfully to xxx@xxx.com`
   - ❌ 失败：会显示具体错误信息

### 3. 检查邮件接收
- 查看目标邮箱（宠物主人的邮箱）
- 如果没收到，检查垃圾邮件文件夹
- 邮件主题格式：`【宠物名】 has been marked as "Lost"`

## 🔍 故障排查

### 常见问题

1. **"Gmail SMTP credentials missing"**
   - 检查 `.env.local` 文件是否在项目根目录
   - 确认环境变量名称拼写正确
   - 重启开发服务器

2. **"Invalid login"**
   - 确认使用的是应用专用密码，不是 Gmail 登录密码
   - 检查两步验证是否已启用
   - 应用专用密码去除空格

3. **"Authentication failed"**
   - Gmail 账户可能被标记为不安全
   - 尝试重新生成应用专用密码
   - 确认 Gmail 账户状态正常

4. **邮件进入垃圾箱**
   - 首次发送可能被标记为垃圾邮件
   - 可以考虑使用自定义域名邮箱提高信誉

## 📊 发送限制

Gmail SMTP 限制：
- **每日发送限制**：500 封邮件/天
- **每分钟限制**：约 100 封邮件/分钟
- **收件人限制**：每封邮件最多 500 个收件人

对于大多数宠物应用使用场景，这些限制足够使用。

## 🔐 安全建议

1. **保护应用专用密码**
   - 不要在代码中硬编码密码
   - 确保 `.env.local` 在 `.gitignore` 中
   - 定期轮换应用专用密码

2. **监控使用情况**
   - 定期检查 Gmail 发送活动
   - 注意异常发送行为
   - 如有泄露立即撤销应用专用密码

## 🚀 生产环境部署

### Vercel 部署
1. 在 Vercel 项目设置中添加环境变量：
   - `GMAIL_SMTP_USER`
   - `GMAIL_SMTP_PASSWORD`  
   - `GMAIL_SMTP_FROM`
   - `NEXT_PUBLIC_APP_NAME`
   - `NEXT_PUBLIC_APP_URL`

### 其他平台
确保平台支持 SMTP 连接（端口 587/465）
