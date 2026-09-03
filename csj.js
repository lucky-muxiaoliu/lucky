// 星辰影院 drpy 爬虫 - 影视仓 / CatVod 用 (type 3)
// 站点: https://www.csjiesheng.com (AppleCMS 模板, 列表/选集/封面均为静态HTML, 播放m3u8写在播放页里)
var rule = {
  host: 'https://www.csjiesheng.com'
};

var app = {
  init: function (ext) {},

  home: function () {
    return {
      class: [
        { type_id: 'dianying', type_name: '电影' },
        { type_id: 'dongzuopian', type_name: '动作片' },
        { type_id: 'xijupian', type_name: '喜剧片' },
        { type_id: 'aiqingpian', type_name: '爱情片' },
        { type_id: 'kehuanpian', type_name: '科幻片' },
        { type_id: 'kongbupian', type_name: '恐怖片' },
        { type_id: 'juqingpian', type_name: '剧情片' },
        { type_id: 'zhanzhengpian', type_name: '战争片' },
        { type_id: 'jilupian', type_name: '记录片' },
        { type_id: 'yingshijieshuo', type_name: '影视解说' },
        { type_id: 'lianxuju', type_name: '连续剧' },
        { type_id: 'guochanju', type_name: '国产剧' },
        { type_id: 'gangtaiju', type_name: '港台剧' },
        { type_id: 'rihanju', type_name: '日韩剧' },
        { type_id: 'oumeiju', type_name: '欧美剧' },
        { type_id: 'haiwaiju', type_name: '海外剧' },
        { type_id: 'duanju', type_name: '短剧' },
        { type_id: 'zongyi', type_name: '综艺' },
        { type_id: 'daluzongyi', type_name: '大陆综艺' },
        { type_id: 'rihanzongyi', type_name: '日韩综艺' },
        { type_id: 'oumeizongyi', type_name: '欧美综艺' },
        { type_id: 'gangtaizongyi', type_name: '港台综艺' },
        { type_id: 'dongman', type_name: '动漫' },
        { type_id: 'rihandongman', type_name: '日韩动漫' },
        { type_id: 'guochandongman', type_name: '国产动漫' },
        { type_id: 'oumeidongman', type_name: '欧美动漫' },
        { type_id: 'donghuapian', type_name: '动画片' }
      ]
    };
  },

  // 从一段 <li>...</li> 块里抽出影片: id / 标题 / 封面
  _parseList: function (html) {
    var list = [];
    var liRe = /<li[^>]*>([\s\S]*?)<\/li>/g;
    var m;
    while ((m = liRe.exec(html)) !== null) {
      var block = m[1];
      // 影片链接是相对路径 xcd/数字.html (有时带开头 /)
      var lm = block.match(/href="\/?xcd\/(\d+)\.html"/);
      if (!lm) continue;
      var id = lm[1];
      // 标题: 优先 a 标签的 title 属性, 其次 <h4>, 再其次 <a> 文本
      var tm = block.match(/title="([^"]+)"/) ||
               block.match(/<h4[^>]*>([^<]+)<\/h4>/) ||
               block.match(/<a[^>]*>([^<]+)<\/a>/);
      var title = tm ? tm[1].trim().replace(/\s+/g, ' ') : '';
      // 封面: data-original / data-src / img src
      var pm = block.match(/data-original="([^"]+)"/) ||
               block.match(/data-src="([^"]+)"/) ||
               block.match(/<img[^>]+src="([^"]+)"/);
      var pic = pm ? pm[1] : '';
      if (id && title) {
        list.push({ vod_id: id, vod_name: title, vod_pic: pic });
      }
    }
    return list;
  },

  category: function (tid, pg, filter, extend) {
    // 分类页: /xct/<tid>.html , 第2页尝试 /xct/<tid>-2.html
    var url = rule.host + '/xct/' + tid + (pg > 1 ? ('-' + pg) : '') + '.html';
    var html = request(url);
    var list = this._parseList(html);
    if (pg > 1 && list.length === 0) {
      // 退回带 ?page= 的形式
      html = request(rule.host + '/xct/' + tid + '.html?page=' + pg);
      list = this._parseList(html);
    }
    return { list: list, page: pg };
  },

  detail: function (id) {
    var url = rule.host + '/xcd/' + id + '.html';
    var html = request(url);
    var tm = html.match(/<h1[^>]*class="title"[^>]*>([^<]+)<\/h1>/) ||
             html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    var title = tm ? tm[1].trim() : '';
    var pm = html.match(/data-original="([^"]+)"/);
    var pic = pm ? pm[1] : '';
    var dm = html.match(/简介[:：]?\s*<\/span>([\s\S]*?)</) ||
             html.match(/<p[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    var desc = dm ? dm[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';
    // 选集链接: xcp/<vid>/<from>/<ep>.html (相对路径)
    var epRe = /href="\/?xcp\/(\d+)\/(\d+)\/(\d+)\.html"/g;
    var fromMap = {};
    var em;
    while ((em = epRe.exec(html)) !== null) {
      var vid = em[1], f = em[2], e = em[3];
      if (!fromMap[f]) fromMap[f] = [];
      fromMap[f].push(vid + '/' + f + '/' + e);
    }
    var playUrls = [];
    for (var f in fromMap) {
      var eps = fromMap[f].slice().sort(function (a, b) {
        return parseInt(a.split('/')[2]) - parseInt(b.split('/')[2]);
      });
      playUrls.push('线路' + f + '$' + eps.join('#'));
    }
    return {
      list: [{
        vod_id: id,
        vod_name: title,
        vod_pic: pic,
        vod_content: desc,
        vod_play_url: playUrls.join('|||')
      }]
    };
  },

  search: function (wd, quick) {
    var url = rule.host + '/ss/wd/' + encodeURIComponent(wd) + '.html';
    var html = request(url);
    return { list: this._parseList(html) };
  },

  play: function (flag, id, flags) {
    // id 形如 351998/1/1 -> 播放页 /xcp/351998/1/1.html
    var url = rule.host + '/xcp/' + id + '.html';
    var html = request(url);
    // m3u8 直接写在播放页里, 例如 /202609/02/xxx/video/index.m3u8
    var m = html.match(/["']([^"']*\.m3u8)["']/);
    var playUrl = m ? m[1] : '';
    if (playUrl && playUrl.indexOf('http') !== 0) {
      if (playUrl.indexOf('/') === 0) playUrl = rule.host + playUrl;
    }
    return {
      parse: 0,
      url: playUrl,
      header: { 'User-Agent': 'Mozilla/5.0', 'Referer': rule.host }
    };
  }
};
