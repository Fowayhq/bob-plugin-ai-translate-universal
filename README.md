# AI 通用翻译

Bob 文本翻译插件，支持 OpenAI Chat Completions、OpenAI Responses 和 Anthropic Claude Messages 接口。需要自备相应服务的 API 地址、密钥和模型。最低支持 Bob 1.8.0。

## 安装

从 [Releases](https://github.com/Fowayhq/bob-plugin-ai-translate-universal/releases) 下载最新版 `AITranslateUniversal-*.bobplugin`，双击安装，然后在 Bob 的服务设置中填写 API Key 和模型 ID。默认使用 OpenAI Chat Completions；接入其他格式时，先切换「API 格式」，再填写对应 API 地址。

## 配置

| API 格式 | API 地址示例 | 自动补全后的路径 |
| --- | --- | --- |
| OpenAI Chat Completions | `https://api.openai.com/v1` | `/v1/chat/completions` |
| OpenAI Responses | `https://api.openai.com/v1` | `/v1/responses` |
| Claude Messages | `https://api.anthropic.com/v1` | `/v1/messages` |

「自动补充接口路径」会在域名后补 `/v1`，在已有路径后只补端点。已有完整接口地址时，选择「完整 URL 原样使用」。请填写上游实际支持的模型 ID；内置模型名仅是初始示例。

流式输出默认开启。提示词支持 `{{from}}`、`{{to}}`、`{{text}}`、`{{model}}`、`{{format}}`、`{{prompt}}` 变量。供应商特有参数可以通过「自定义请求参数 JSON」设置，请求头可以通过「自定义请求头 JSON」设置。例如，某些服务关闭思考可填写：

```json
{"thinking":{"type":"disabled"}}
```

这些 JSON 字段会覆盖同名的默认请求字段；请根据所用服务的接口文档填写。API Key 保存在 Bob 的安全输入框中，请勿提交到仓库。

## 从源码打包

仓库根目录的 `info.json` 和 `main.js` 是插件运行文件。打包时必须把这两个文件放在 ZIP 根目录，而不是包一层文件夹：

```sh
zip -X AITranslateUniversal-v1.4.0.bobplugin info.json main.js
shasum -a 256 AITranslateUniversal-v1.4.0.bobplugin
```

发布新版本时，同步修改 `info.json` 的版本、Release 资产和根目录的 `appcast.json`（版本、下载 URL、SHA-256 和毫秒时间戳）。Bob 插件列表从 GitHub 的 `bobplugin` topic 中发现仓库，并读取 `appcast.json`。

## 开发

无需构建依赖。可以使用 Node.js 运行模拟测试：

```sh
node tests/smoke.js
```

更新记录见 [CHANGELOG.md](CHANGELOG.md)。
