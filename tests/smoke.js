const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const info = JSON.parse(fs.readFileSync(path.join(root, "info.json"), "utf8"));
const options = Object.fromEntries(info.options.map((item) => [item.identifier, item.defaultValue || ""]));
const requests = [];
const context = {
  $option: options,
  $http: {
    request(request) { requests.push(request); },
    streamRequest(request) { requests.push(request); },
  },
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "main.js"), "utf8"), context);

function query(onCompletion, onStream = () => {}) {
  return {
    text: "Hello",
    from: "en",
    to: "zh-Hans",
    detectFrom: "en",
    detectTo: "zh-Hans",
    onCompletion,
    onStream,
  };
}

assert.equal(info.version, "1.4.0");
assert.equal(info.category, "translate");
assert.equal(context.endpoint("https://api.openai.com", "chat", "auto"), "https://api.openai.com/v1/chat/completions");
assert.equal(context.endpoint("https://api.openai.com/v1", "responses", "auto"), "https://api.openai.com/v1/responses");
assert.equal(context.endpoint("https://api.anthropic.com/v1", "claude", "auto"), "https://api.anthropic.com/v1/messages");
assert.equal(context.endpoint("https://example.com/custom", "chat", "manual"), "https://example.com/custom");

options.apiKey = "test-key";
options.stream = "false";
let result;
context.translate(query((value) => { result = value; }));
let request = requests.pop();
assert.equal(request.url, "https://api.openai.com/v1/chat/completions");
assert.equal(request.header.Authorization, "Bearer test-key");
assert.equal(request.body.messages[1].content, "Hello");
request.handler({ response: { statusCode: 200 }, data: { choices: [{ message: { content: "你好" } }] } });
assert.equal(result.result.toParagraphs[0], "你好");

options.apiFormat = "responses";
options.customBody = '{"temperature":0.2}';
context.translate(query((value) => { result = value; }));
request = requests.pop();
assert.equal(request.url, "https://api.openai.com/v1/responses");
assert.equal(request.body.instructions.includes("English"), true);
assert.equal(request.body.temperature, 0.2);
request.handler({ response: { statusCode: 200 }, data: { output: [{ content: [{ type: "output_text", text: "你好" }] }] } });
assert.equal(result.result.toParagraphs[0], "你好");

options.apiFormat = "claude";
options.apiURL = "https://api.anthropic.com/v1";
options.customBody = "";
options.stream = "true";
const partials = [];
context.translate(query((value) => { result = value; }, (value) => { partials.push(value.toParagraphs[0]); }));
request = requests.pop();
assert.equal(request.url, "https://api.anthropic.com/v1/messages");
assert.equal(request.header["x-api-key"], "test-key");
assert.equal(request.body.max_tokens, 2048);
request.streamHandler({ text: 'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"你"}}\n\n' });
request.streamHandler({ text: 'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"好"}}\n\n' });
request.handler({ response: { statusCode: 200 } });
assert.equal(partials.at(-1), "你好");
assert.equal(result.result.toParagraphs[0], "你好");

options.customBody = "not-json";
context.translate(query((value) => { result = value; }));
assert.equal(result.error.type, "param");
console.log("Smoke tests passed");
