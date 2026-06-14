// Cloudflare Pages Direct Upload —— 绕过 wrangler
// 流程：
//   1. 遍历 dist 目录，为每个文件计算 SHA-256 + base64
//   2. 构造 deployment manifest
//   3. multipart POST 到 /accounts/{id}/pages/projects/{name}/deployments
//   4. 打印 deployment id + URL

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ACCOUNT_ID = 'a8998e12f9af5d82ad5aac846ca013fb';
const PROJECT_NAME = 'skyborne-weather';
const DIST = process.argv[2] || path.join(__dirname, '..', 'skyborne-dist');

const email = process.env.CLOUDFLARE_EMAIL;
const key = process.env.CLOUDFLARE_API_KEY;
if (!email || !key) { console.error('Need CLOUDFLARE_EMAIL and CLOUDFLARE_API_KEY env vars'); process.exit(1); }

const HEADERS = { 'X-Auth-Email': email, 'X-Auth-Key': key };

// 1. 列出所有文件
function listFiles(dir, base = '') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...listFiles(p, rel));
    else out.push(rel);
  }
  return out;
}

const allFiles = listFiles(DIST);
console.log(`Files to upload: ${allFiles.length}`);

// 2. 构造 manifest（CF Pages 期望的格式：每个文件 base64-SHA256）
const manifest = { files: {} };
for (const rel of allFiles) {
  const buf = fs.readFileSync(path.join(DIST, rel));
  manifest.files[rel] = crypto.createHash('sha256').update(buf).digest('base64');
}
console.log('Manifest built. Uploading...');

// 3. multipart POST
const boundary = '----CF' + Date.now();
const parts = [];
function addPart(name, value, filename) {
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="${name}"${filename ? `; filename="${filename}"` : ''}\r\n` +
    `Content-Type: ${filename ? 'application/octet-stream' : 'application/json'}\r\n\r\n`
  ));
  parts.push(Buffer.isBuffer(value) ? value : Buffer.from(value));
  parts.push(Buffer.from('\r\n'));
}

addPart('manifest', JSON.stringify(manifest));
for (const rel of allFiles) {
  addPart(rel, fs.readFileSync(path.join(DIST, rel)), rel);
}
parts.push(Buffer.from(`--${boundary}--\r\n`));
const body = Buffer.concat(parts);

const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments`;
console.log('POST ' + url);

const https = require('https');
const parsed = new URL(url);
const req = https.request({
  hostname: parsed.hostname,
  port: 443,
  path: parsed.pathname,
  method: 'POST',
  headers: {
    ...HEADERS,
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length,
  },
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status: ' + res.statusCode);
    console.log(data);
    try {
      const json = JSON.parse(data);
      if (json.success && json.result) {
        console.log('Deployment id:', json.result.id);
        console.log('URL:', json.result.url);
      } else {
        process.exit(1);
      }
    } catch (e) { process.exit(1); }
  });
});
req.on('error', (e) => { console.error('Request error:', e.message); process.exit(1); });
req.write(body);
req.end();
