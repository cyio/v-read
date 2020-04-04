# 数据结构

type api | html | rss

1. api | rss

    url

2. html

    url

    selectors

        url | title

一个 feed，以 name 为 key，不关心顺序、方便查找，缺点是不能重名。feeds 排序单独保存和维护。sorting 默认为空数组，表示顺序为默认。

```json
{
  "sorting": [],
  "feeds": {
    "最新 - V2EX": {
      "name": "最新 - V2EX",
      "icon": "http://hk.v2ex.com/static/img/icon_rayps_64.png",
      "type": "api",
      "url": "https://hk.v2ex.com/api/topics/latest.json"
    },
    "热门 - LVV2社区": {
      "name": "热门 - LVV2社区",
      "icon": "https://lvv2.com/templates/default/images/favicon.ico",
      "selectors": {
        "url": ".entry a.title"
      },
      "type": "html",
      "url": "https://lvv2.com/"
    },
    "币世界": {
      "name": "币世界",
      "icon": "https://www.bishijie.com/favicon.ico",
      "selectors": {
        "url": ".content a",
        "title": ".content a h3"
      },
      "type": "html",
      "url": "https://www.bishijie.com/kuaixun/"
    },
    "Bitcoin - Reddit": {
      "name": "Bitcoin - Reddit",
      "icon": "https://img.bishijie.com/coinpic-bitcoin.jpg?imageMogr2/thumbnail/100x",
      "selectors": {
        "url": "#siteTable .title.may-blank"
      },
      "type": "html",
      "url": "http://www.reddit.com/r/btc"
    },
    "购物 - 水木社区": {
      "name": "购物 - 水木社区",
      "icon": "http://images.newsmth.net/nForum/favicon.ico",
      "type": "rss",
      "url": "http://www.newsmth.net/nForum/rss/board-Shopping"
    },
    "精选 - 什么值得买": {
      "name": "精选 - 什么值得买",
      "icon": "http://www.smzdm.com/favicon.ico",
      "selectors": {
        "url": "#feed-main-list .feed-block-title a"
      },
      "type": "html",
      "url": "http://www.smzdm.com/jingxuan/#list_6"
    },
    "薅羊毛 - 购物党": {
      "name": "薅羊毛 - 购物党",
      "icon": "http://gwdang.com/favicon.ico",
      "selectors": {
        "url": ".title.tl"
      },
      "type": "html",
      "url": "http://gwdang.com/promotion/yangmao"
    }
  }
}

```
