// 星辰影院 drpy 源 — 影视仓 / TVBox 内置 drpy 引擎 (type 3)
// 格式: var rule 声明式 (影视仓只认这种, 全局函数 / var app 写法都不会被加载)
// 站点: https://www.csjiesheng.com (AppleCMS 模板)
var rule = {
  title: '星辰影院',
  host: 'https://www.csjiesheng.com',
  homeUrl: '/',
  // 分类页: /xct/<分类id>.html?page=<页数>  (验证过 ?page=1 有效; /xct/dianying-1.html 这种 -N 格式返回空)
  url: '/xct/fyclass.html?page={fypage}',
  // 搜索: /ss/wd/<关键词>.html
  searchUrl: '/ss/wd/**.html',
  searchable: 1,
  quickSearch: 0,
  filterable: 0,
  headers: {
    'User-Agent': 'MOBILE_UA',
    'Referer': 'https://www.csjiesheng.com'
  },
  timeout: 5000,
  play_parse: true,
  // 静态分类 (名称 & 标识 一一对应, 用 & 分隔)
  class_name: '电影&动作片&喜剧片&爱情片&科幻片&恐怖片&剧情片&战争片&记录片&影视解说&连续剧&国产剧&港台剧&日韩剧&欧美剧&海外剧&短剧&综艺&大陆综艺&日韩综艺&欧美综艺&港台综艺&动漫&日韩动漫&国产动漫&欧美动漫&动画片',
  class_url: 'dianying&dongzuopian&xijupian&aiqingpian&kehuanpian&kongbupian&juqingpian&zhanzhengpian&jilupian&yingshijieshuo&lianxuju&guochanju&gangtaiju&rihanju&oumeiju&haiwaiju&duanju&zongyi&daluzongyi&rihanzongyi&oumeizongyi&gangtaizongyi&dongman&rihandongman&guochandongman&oumeidongman&donghuapian',
  // 一级(分类/搜索列表): 列表容器;标题;图片;描述;链接;详情
  // 影片卡片在 <ul class="myui-vodlist"> 内, <a href="/xcd/ID.html" title="片名" data-original="封面">
  一级: 'ul.myui-vodlist;a&&title;a&&data-original;;a&&href;xcd/([0-9]+).html',
  // 二级(详情页): 标题 / 封面 / 简介 / 线路名 / 选集
  // 选集: <a class="btn" href="/xcp/ID/FROM/EP.html">  线路名容器: <h3 class="title">线路</h3>
  二级: {
    title: 'h1.title&&Text',
    img: 'img&&data-original',
    desc: '.myui-content__detail&&Text',
    tabs: 'h3.title&&Text',
    lists: '.myui-content__list a&&href'
  },
  // 搜索复用一级结构
  搜索: '*',
  // 播放: 免嗅提取真实 m3u8 (播放页 /xcp/<id>/<from>/<ep>.html 里 m3u8 为静态HTML)
  lazy: function (flag, id, args) {
    var BASE = 'https://www.csjiesheng.com';
    var url = (id.indexOf('http') === 0) ? id : (BASE + id);
    var html = request(url);
    var m = html.match(/["']([^"']*\.m3u8)["']/);
    var playUrl = m ? m[1] : '';
    if (playUrl && playUrl.indexOf('http') !== 0) {
      playUrl = BASE + playUrl; // 相对路径补全为绝对地址
    }
    return { url: playUrl, header: { 'User-Agent': 'Mozilla/5.0', 'Referer': BASE } };
  }
};
