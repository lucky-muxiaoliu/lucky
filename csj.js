// 星辰影院 drpy 爬虫 - 给影视仓 / CatVod 用 (type 3)
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

  _parseList: function (html) {
    var list = [];
    var liRe = /<li[^>]*>([\s\S]*?)<\/li>/g;
    var linkRe = /href="\/xcd\/(\d+)\.html"/;
    var titleRe = /<h[1-6][^>]*>\s*(?:<a[^>]*>)?\s*([^<]+?)\s*(?:<\/a>)?\s*<\/h[1-6]>/;
    var picRe = /<img[^>]+(?:data-original|data-src|src)="([^"]+)"/;
    var remarkRe = /\b(更新?HD|HD|TC|BD|DVD)\b/;
    var m;
    while ((m = liRe.exec(html)) !== null) {
      var block = m[1];
      var lm = block.match(linkRe);
      if (!lm) continue;
      var id = lm[1];
      var tm = block.match(titleRe);
      var title = tm ? tm[1].trim().replace(/\s+/g, ' ') : '';
      var pm = block.match(picRe);
      var pic = pm ? pm[1] : '';
      var rm = block.match(remarkRe);
      var remarks = rm ? rm[1] : '';
      if (id && title) {
        list.push({
          vod_id: id,
          vod_name: title,
          vod_pic: pic,
          vod_remarks: remarks
        });
      }
    }
    return list;
  },

  category: function (tid, pg, filter, extend) {
    var url = rule.host + '/xct/' + tid + (pg > 1 ? ('-' + pg) : '') + '.html';
    var html = request(url);
    return { list: this._parseList(html), page: pg };
  },

  detail: function (id) {
    var url = rule.host + '/xcd/' + id + '.html';
    var html = request(url);
    var tm = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    var title = tm ? tm[1].trim() : '';
    var pm = html.match(/<img[^>]+(?:data-original|data-src)="([^"]+)"/);
    var pic = pm ? pm[1] : '';
    var dm = html.match(/剧情简介[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
    var desc = dm ? dm[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';
    var epRe = /href="\/xcp\/\d+\/(\d+)\/(\d+)\.html"/g;
    var fromMap = {};
    var em;
    while ((em = epRe.exec(html)) !== null) {
      var f = em[1], e = em[2];
      if (!fromMap[f]) fromMap[f] = [];
      fromMap[f].push(e);
    }
    var playUrls = Object.keys(fromMap).map(function (f) {
      var eps = fromMap[f].slice().sort(function (a, b) { return parseInt(a) - parseInt(b); });
      var urls = eps.map(function (e) { return id + '/' + f + '/' + e; });
      return '线路' + f + '$' + urls.join('#');
    });
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
    var url = rule.host + '/xcp/' + id + '.html';
    var html = request(url);
    var m3u8 = html.match(/(https?:\/\/[^\s"'<>\\]*\.m3u8[^\s"'<>\\]*)/i);
    var playUrl = m3u8 ? m3u8[1] : '';
    if (!playUrl) {
      var um = html.match(/["'](https?:\/\/[^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
      if (um) playUrl = um[1];
    }
    if (!playUrl) {
      var im = html.match(/<iframe[^>]+src="([^"]+)"/);
      if (im) playUrl = im[1];
    }
    return {
      parse: 0,
      url: playUrl,
      header: { 'User-Agent': 'Mozilla/5.0', 'Referer': rule.host }
    };
  }
};
