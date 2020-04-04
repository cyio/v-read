import Vue from 'vue'
import $ from 'jquery'
import axios from 'axios'
import { mainConnector } from './modules/utils'

const port  = new mainConnector();
port.name = "chrome-extension-skeleton";
port.init();
port.onMessage((msg) => {
  // console.log('frontend msg', msg)
})

Vue.config.productionTip = false
Vue.config.devtools = false

const feedsApiUrl = '../data/default.json'
const maxItemNum = 15
const alphabet = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"]
new Vue({
  el: '#app',
  data: {
    list: [],
    apiData: null,
    activeItemName: null,
    showPreloader: true,
    showHint: false,
  },
  methods: {
    getFeedsApi (url) {
      return axios.get(url).then(res => res.data);
    },
    getList (site) {
      axios.get(site.url).then(res => this.parseSiteHtml(site, res.data))
    },
    getApiData() {
      chrome.storage.sync.get([ 'apiData' ], async (items) => {
        this.apiData = items.apiData
          ? items.apiData
          : await this.getFeedsApi(feedsApiUrl).then((tmpData) => {
            let data = {...tmpData}
            if (!data.sorting.length) {
              for (let i of Object.keys(data.feeds)) {
                data.sorting.push(i)
              }
            }
            this.activeItemName = data.sorting[0]
            console.log(data)
            chrome.storage.sync.set({ apiData: data })
            return data
          })

        this.activeItemName = this.apiData.sorting[0]
        this.handleSite(this.activeItemName)
      });
    },
    parseSiteHtml (site, data) {
      console.warn(site)
      let parsedData = {
        url: [],
        title: []
      }
      parsedData.url = $(data).find(site.selectors.url) // url 可能跟 title 不在一级。由用户提前设定更好？
      parsedData.title = site.selectors.title ? $(data).find(site.selectors.title) : $(data).find(site.selectors.url)
      for (let i = 0; i < maxItemNum; i++) {
        let post = {
          url: $(parsedData.url[i]).attr("href"),
          title: $.trim($(parsedData.title[i]).text())
          // media: $(mediaData[i]).attr("src") || ""
        };
        console.log('post.url ', post.url)
        if (!post.url) continue
        if (post.url.indexOf("http") == -1) {
          let baseUrl = site.url.match(/http[s]?:\/\/+[\s\S]+?\//)[0].slice(0, -1);
          if (post.url[0] != "/") {
            baseUrl += "/"
          }
          post.url = baseUrl + post.url;
          post.media = baseUrl + post.media;
        };
        this.list.push(post);
      };
      // console.log(this.list)
      this.showPreloader = false
    },
    // TODO
    parseXML (rssUrl) {
    },
    switchList (name) {
      console.log('handle id ', name)
      this.showHint = false
      this.activeItemName = name
      this.handleSite(this.activeItemName)
      // 上一项，若有未完成请求，如何取消，避免影响当前项展示
    },
    openTab (url) {
      chrome.tabs.create({
        url: url,
        selected: false
      })
    },
    handleSite (id) {
      this.list = []
      this.showPreloader = true
      const site = this.apiData.feeds[id]
      console.warn('id', id, site.type, site.url)
      if (site.type === 'api') {
        axios.get(site.url).then(res => {
          res.data.forEach((item) => {
            this.list.push({
              title: item.title,
              url: item.url
            })
          })
          this.list.length = maxItemNum
          this.showPreloader = false
        })
      } else if (site.type === 'rss') {
        $.get(site.url, data => { // 用 axios 请求 rss 有问题
          $(data).find('item').each((index, item) => {
            this.list.push({
              title: $(item).find('title')[0].textContent,
              url: $(item).find('link')[0].textContent
            })
          })
          this.showPreloader = false
        })
      } else {
        this.getList(site)
      }
    },
    setClickHandler() {
      // 设定后台打开链接
      // 必须委托绑定，否则 chrome.tabs 设定会失效
      let listItemHandler = function(e) {
        e.preventDefault();
        chrome.tabs.create({
          url: $(this).attr("href"),
          selected: false
        });
      };
      $('body').off('click', '.list .link', listItemHandler);
      $('body').on('click', '.list .link', listItemHandler);
    },
    setHints() {
      $('body').keydown(e => {
        let feedNames = this.apiData.sorting
        switch (e.keyCode) {
          case 40: // down arrow
            if (this.activeItemName === feedNames[feedNames.length - 1]) {
              this.switchList(feedNames[0])
            } else {
              this.switchList(feedNames[feedNames.indexOf(this.activeItemName) + 1])
            }
            break
          case 38: // up arrow
            if (this.activeItemName !== feedNames[0]) {
              this.switchList(feedNames[feedNames.indexOf(this.activeItemName) - 1])
            } else {
              this.switchList(feedNames[feedNames.length - 1])
            }
            break
          case 27: // escape
            if (this.showHint) {
              e.preventDefault()
              this.showHint = false
            }
            break
          case 70: // f
            if (!this.showHint) {
              this.showHint = true
              break
            }
          default:
            const linkId = String.fromCharCode(e.keyCode)
            $(`[link-id=${linkId}]`).click()
        }
      })
    }
  },
  computed: {
    hasApiData() {
      return this.apiData && Object.keys(this.apiData.feeds).length
    },
  },
  mounted () {
    // Storage.setValue('ver', '1.0')
    // port.send({act: 'say hello'})
		// this.parseXML()
		this.getApiData()
		this.setClickHandler()
		this.setHints()
  },
  render (h) { // <-- h must be in scope
    return (
      <div id="app">
        <div class="left-nav">
          { this.hasApiData &&  this.apiData.sorting.map((name, index) => {
            let item = this.apiData.feeds[name]
            return (
              <div class={["item", (item.name === this.activeItemName) && "active"]}>
                <img src={item.icon} title={item.name} onClick={this.switchList.bind(this, item.name)} />
              </div>
            )
          }) }
        </div>
        <div class="main">
          <div class="navbar">
            <div class="title">{this.hasApiData && this.apiData.feeds[this.activeItemName].name}</div> 
          </div>
          <div class="list" >
            {this.showPreloader ? <div class="preloader"></div>
                : 
                this.list.map((item, index) => {
                  return (
                    <div class="item">
                      <a class="link" href={item.url} title={item.title} link-id={alphabet[index].toUpperCase()}>{item.title}</a>
                      {this.showHint && <span class="hint">{alphabet[index].toUpperCase()}</span>}
                    </div>
                  )
                })
            }
          </div>
        </div> 
      </div>
    )
  }
})
