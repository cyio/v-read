import Vue from 'vue'
import { Storage, sleep } from './modules/utils'
Vue.config.productionTip = false
Vue.config.devtools = false

var app = new Vue({
  el: '#app',
  data: {
    apiData: null,
    currentId: null,
    currentItem: null,
		showModal: false,
  },
  methods: {
    saveOptions() {
      chrome.storage.sync.set({
        favoriteColor: this.favoriteColor,
        likesColor: this.likesColor
      }, async () => {
        this.statusText = 'Options saved.';
        await sleep(700)
        this.statusText = ''
        // setTimeout(() => {
          // this.statusText = ''
        // }, 750)
      });
    },
    restoreOptions() {
      chrome.storage.sync.get({
        favoriteColor: this.favoriteColor, // 设置默认值，不需要也可用数组
        likesColor: this.likesColor
      }, (items) => {
        this.favoriteColor = items.favoriteColor;
        this.likesColor = items.likesColor;
      });
    },
    onChange(name, e) {
			this[name] = e.target.value
    },
    getApiData() {
      chrome.storage.sync.get({
        apiData: null, // 设置默认值，不需要也可用数组
      }, (items) => {
        if (items.apiData) {
          // console.log('get', items.apiData)
          this.apiData = items.apiData
        }
      });
    },
    cleanStorage() {
      this.apiData = null
      chrome.storage.sync.set({
        apiData: null, // 设置默认值，不需要也可用数组
      }, () => {
        alert('清除成功')
      });
    },
    saveItemForm() {
      this.apiData[this.currentId] = this.currentItem
      chrome.storage.sync.set({ apiData: this.apiData })
      this.showModal = false
    }
  },
  computed: {
  },
  mounted () {
    this.restoreOptions()
    this.getApiData()
  },
  render (h) { // <-- h must be in scope
    return (
      <div class="container">
        <div class="navigation">
          <h1>V-Read</h1>
          <ul class="menu">
            <li class="selected">我的订阅</li>
          </ul>
        </div>
        <div class="mainView">
          <h1>我的订阅</h1>
          <div class="controls">
            <button class="add">添加订阅</button>
            <button>导入</button>
            <button>导出</button>
            <button onClick={this.cleanStorage.bind(this)}>清空存储</button>
          </div>
          <div class="content">
            <ul>
              {
                this.apiData && this.apiData.map((item, index) => {
                  return (
                    <li class="item" onClick={() => {
                      this.showModal = true
                      this.currentId = index
                      this.currentItem = item
                    }}>
                      <img class="logo" src={item.icon} />
                      <div class="itemMain">
                        <div class="itemTitle">{item.name}</div>
                        <div class="itemUrl">{item.url}</div>
                      </div>
                    </li>
                  )
                })
              }
            </ul>
          </div>
        </div>
        {
          this.showModal && (
            <div class="modal-mask">
              <div class="modal-wrapper">
                <div class="modal-container">
                  <h3>订阅表单</h3>
									<div class="close-button"  onClick={() => this.showModal = false}></div>
                  <div class="content-area">
                    <p>类型</p>
                    <select domPropsValue={this.currentItem.type} onChange={(e) => this.currentItem.type = e.target.value}>
                      <option value="html">HTML</option>
                      <option value="api">API</option>
                    </select>
                    <p>标题</p>
                    <input domPropsValue={this.currentItem.name} onChange={e => this.currentItem.name = e.target.value}/>
                    <p>图标</p>
                    <input domPropsValue={this.currentItem.icon} onChange={e => this.currentItem.icon = e.target.value}/>
                    <p>地址</p>
                    <input domPropsValue={this.currentItem.url} onChange={e => this.currentItem.url = e.target.value}/>
                    {
                      this.currentItem.type === 'html' && (
                        <div>
                          <p>选择器</p>
                          <ul class="selectors">
                            {Object.keys(this.currentItem.selectors).map((name) => {
                              let {selector} = this.currentItem.selectors[name]
                              return (
                                <li>
                                  <label>{name}</label>
                                  <input domPropsValue={this.currentItem.selectors[name]} onChange={e => this.currentItem.selectors[name] 
= e.target.value}/>
                                </li>
                              )
                            } )}
                          </ul>
                        </div>
                      )
                    }
                  </div>
                  <div class="action-area">
                    <button  onClick={() => this.showModal = false}>取消</button>
										<button onClick={this.saveItemForm.bind(this)}>确定</button>
                  </div>
                </div>
              </div>
            </div>
          )
        }
      </div>
    )
  }
})
