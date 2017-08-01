import Vue from 'vue'
import $ from 'jquery'
import axios from 'axios'
import { mainConnector, Storage } from './modules/utils'
import Hello from './hello.js'

const port  = new mainConnector();
port.name = "chrome-extension-skeleton";
port.init();
port.onMessage((msg) => {
  // console.log('frontend msg', msg)
})

Vue.config.productionTip = false
Vue.config.devtools = false

const feedApiUrl = '../data/hot.json'
const maxItemNum = 15
const app = new Vue({
  el: '#app',
  data: {
    list: [],
    apiData: {},
    currentID: 4,
    showPreloader: true
  },
  methods: {
    getFeedApi (url) {
      return axios.get(url).then(res => res.data);
    },
    getList (site) {
      axios.get(site.url).then(res => this.parseSiteHtml(site, res.data))
    },
    parseSiteHtml (site, data) {
      console.warn(site.name)
      let parsedData = {
        url: [],
        title: []
      }
      parsedData.url = $(data).find(site.selector.url)
      parsedData.title = site.selector.title ? $(data).find(site.selector.title) : $(data).find(site.selector.url)
      for (let i = 0; i < maxItemNum; i++) {
        let post = {
          url: $(parsedData.url[i]).attr("href"),
          title: $.trim($(parsedData.title[i]).text())
          // media: $(mediaData[i]).attr("src") || ""
        };
        console.log(post.url)
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
    parseXML (rssUrl) {
    },
    switchList (index) {
      this.currentID = index
      this.handleSite(this.currentID)
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
      const site = this.apiData[id]
      console.warn('id', id, site)
      if (site.api) {
        axios.get(site.api).then(res => {
          res.data.forEach((item) => {
            this.list.push({
              title: item.title,
              url: item.url
            })
          })
          this.showPreloader = false
        })
      } else if (site.rss) {
        axios.get(site.rss, res => {
          $(res.data).find('item').each((index, item) => {
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
    }
  },
  computed: {
    hasApiData() {
      return this.apiData && this.apiData.length
    }
  },
  mounted () {
    Storage.setValue('ver', '1.0')
    port.send({act: 'say hello'})
		this.parseXML()
    this.getFeedApi(feedApiUrl).then((data) => {
      // console.warn('data', data)
			this.apiData = data
			this.handleSite(this.currentID)
		})

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
  render (h) { // <-- h must be in scope
    return (
      <div id="app">
        <div class="left-nav">
          { this.hasApiData && this.apiData.map((item, index) => {
            return (
              <div class={["item", (index === this.currentID) && "active"]}>
                <img src={item.icon} title={item.name} onClick={this.switchList.bind(this, index)} />
              </div>
            )
          }) }
        </div>
        <div class="main">
          <div class="navbar">
            <div class="title">{this.hasApiData && this.apiData[this.currentID].name}</div> 
          </div>
          <div class="list" >
            {this.showPreloader ? <div class="preloader"></div>
                : 
                this.list.map((item) => {
                  return (
                    <div class="item">
                      <a class="link" href={item.url} title={item.title}>{item.title}</a>
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
