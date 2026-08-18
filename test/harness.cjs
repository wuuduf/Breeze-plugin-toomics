// Breeze 插件 Node 集成测试 harness
// mock breeze-plugin-kit，真实执行 bundle + 真实请求 toomics
const path = require('path');

// ---- mock breeze-plugin-kit ----
const store = {};
const pluginConfig = {
  load: async (k, d) => JSON.stringify(store[k] ?? { value: d }),
  save: async (k, v) => { store[k] = v; },
};
const cache = {
  get: async () => null,
  set: async () => {},
};
const flutterTools = {
  showToast: async (o) => console.log('  [Toast]', o.level || 'info', ':', (o.message || '').slice(0, 60)),
};

const kitMockDir = path.join(__dirname, 'node_modules', 'breeze-plugin-kit');
require('fs').mkdirSync(kitMockDir, { recursive: true });
require('fs').writeFileSync(path.join(kitMockDir, 'index.js'),
  'module.exports = { cache: globalThis.__mock.cache, flutterTools: globalThis.__mock.flutterTools, pluginConfig: globalThis.__mock.pluginConfig };');
globalThis.__mock = { cache, flutterTools, pluginConfig };

const reqd = require('/root/toomics-plugin/dist/breeze-plugin-toomics.bundle.cjs');
const plugin = reqd.default || reqd;
console.log('插件导出:', Object.keys(plugin).join(', '));

async function main() {
  const which = process.argv[2] || 'info';
  if (which === 'info' || which === 'all') {
    const info = await plugin.getInfo();
    console.log('\n=== getInfo ===');
    console.log('名称:', info?.source?.name, '| 版本:', info?.source?.version);
    console.log('功能数:', (info?.function || []).length);
  }
  if (which === 'all') {
    // 榜单
    console.log('\n=== 榜单 ===');
    const lst = await plugin.getRankingData({ extern: { source: 'ranking' } });
    console.log('榜单条数:', (lst?.data?.items || []).length, '| title0:', lst?.data?.items?.[0]?.title);
    // 搜索
    console.log('\n=== 搜索 school ===');
    const sr = await plugin.searchComic({ keyword: 'school', page: 1 });
    console.log('搜索条数:', (sr?.data?.items || []).length, '| title0:', sr?.data?.items?.[0]?.title);
    // 详情
    console.log('\n=== 详情 toon 1695 ===');
    const dt = await plugin.getComicDetail({ comicId: '1695' });
    console.log('详情标题:', dt?.data?.normal?.comicInfo?.title, '| 章节数:', (dt?.data?.normal?.eps || []).length);
    console.log('章节[0]:', JSON.stringify(dt?.data?.normal?.eps?.[0]));
    // 阅读（免费章节）
    console.log('\n=== 阅读 ep/1(code) ===');
    const ep = dt?.data?.normal?.eps?.[0];
    if (ep) {
      const ch = await plugin.getReadSnapshot({ chapterId: ep.id, requestId: ep.requestId, storageChapterId: ep.storageChapterId, comicId: '1695' });
      console.log('阅读快照 pages:', (ch?.data?.pages || []).length, '| page0:', (ch?.data?.pages?.[0]?.url || '').slice(0, 70));
    }
  }
  if (which === 'login') {
    console.log('\n=== 登录 ===');
    const r = await plugin.loginWithPassword({ userId: 'neversaynever@nodeseek.org', userPw: 'qazwsxedc123' });
    console.log('登录结果:', JSON.stringify(r).slice(0, 300));
  }
  if (which === 'user') {
    console.log('\n=== 用户信息 ===');
    const u = await plugin.getUserInfoBundle();
    console.log('用户卡片:', JSON.stringify(u?.data).slice(0, 400));
  }
}
main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
