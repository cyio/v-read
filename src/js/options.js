import Vue from 'vue'
import { Storage, sleep, IsJsonString } from './modules/utils'
import Modal from './modal.js'
import draggable from "vuedraggable"
Vue.config.productionTip = false
Vue.config.devtools = false

var app = new Vue({
  el: '#app',
  components: {
    draggable,
  },
  data: {
    apiData: null,
    list: [],
    currentId: null,
    currentItem: null,
    showModals: {
      edit: false,
      importData: false,
      exportData: false
    },
  },
  methods: {
    getApiData() {
      chrome.storage.sync.get({
        apiData: null, // 设置默认值，不需要也可用数组
      }, (items) => {
        if (items.apiData) {
          const { apiData } = items
          console.log('get', apiData)
          this.apiData = apiData
          this.setList()
        }
      });
    },
    clearStorage() {
      if (!confirm('确认清除')) return
      this.apiData = null
      chrome.storage.sync.set({ apiData: null })
    },
    saveItemForm() {
      if (!this.apiData.feeds[this.currentItem.name]) {
        this.apiData.feeds[this.currentItem.name] = this.currentItem
        this.apiData.sorting.push(this.currentItem.name)
        this.setList()
        this.updateApiData()
      }
      this.showModals.edit = false
    },
    addItem() {
      this.currentItem = {
        "type": "html",
        "name": null,
        "icon": null,
        "url": null,
        "selectors": {
          "url": null
        },
        "isShow": true
      }
      this.showModals.edit = true
    },
    deleteItem(name, index) {
      if (!confirm(`确认删除${index}？`)) return
      if (delete this.apiData.feeds[name]) {
        console.log(name, index)
        this.apiData.sorting.splice(index, 1)
        this.setList()
        this.updateApiData()
      }
    },
    showItem(item) {
      this.showModals.edit = true
      this.currentItem = item
      this.currentId = item.name
    },
    cloneItem(item) {
      let cloneItem = {...item}
      cloneItem.name = cloneItem.name
      this.currentItem = cloneItem
      this.showModals.edit = true
    },
    importData() {
      let input = prompt('将 JSON 格式的内容粘贴到输入框')
      if (input) {
        if (!IsJsonString(input)) {
          alert('不是有效的 JSON 格式')
          return
        }
        const apiData = JSON.parse(input)
        if (apiData.sorting.length === 0) {
          apiData.sorting = Object.keys(apiData.feeds)
        }
        this.apiData = apiData
        this.updateApiData()
      }
    },
    async exportData() {
      this.showModals.exportData = true
      await sleep(200)
      document.getElementById('exportData').value = JSON.stringify(this.apiData, null, 2)
    },
    updateApiData() {
      if (this.list.length) {
        this.apiData.sorting = this.list.map(i => i && i.name)
      }
      // this.apiData.sorting = this.apiData.sorting.filter(i => Boolean(i))
      console.log('update apiData', this.apiData.sorting)
      chrome.storage.sync.set({ apiData: this.apiData })
    },
    setList() {
      this.list = this.apiData.sorting.map((name) => this.apiData.feeds[name])
      console.log(this.list)
    }
  },
  computed: {
  },
  mounted () {
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
            <button class="add" onClick={this.addItem.bind(this)}>添加订阅</button>
            <button onClick={this.importData.bind(this)}>导入</button>
            <button onClick={this.exportData.bind(this)}>导出</button>
            <button onClick={this.clearStorage.bind(this)}>清空</button>
          </div>
          <div class="content">
            <ul id="items" class="items">
              {
                this.apiData && (
                  <draggable
                    list={this.list}
                    class="list-group"
                    ghost-class="ghost"
                    onEnd={this.updateApiData}
                  >
                      {
                        this.list.map((item, index) => {
                          if (!item) return false
                          return (
                            <li class="item" data-id={item.name}>
                              <div class="itemInner">
                                <img class="logo" src={item.icon} />
                                <div class="itemMain">
                                  <div class="itemTitle">{item.name}</div>
                                  <div class="itemUrl">{item.url}</div>
                                </div>
                                <div class="btnGroup">
                                  <div class="action edit" onClick={this.showItem.bind(this, item)}>编辑</div>
                                  <div class="action" onClick={this.cloneItem.bind(this, item)}>克隆</div>
                                  <div class="action" onClick={this.deleteItem.bind(this, item.name, index)}>删除</div>
                                </div>
                              </div>
                            </li>
                          )
                        })
                      }
                  </draggable>
                )
              }
            </ul>
          </div>
        </div>
        {
          this.showModals.edit && (
            <Modal slot="modalContent">
              <div>
                <h3>订阅表单</h3>
                <div class="close-button"  onClick={() => this.showModals.edit = false}></div>
                <div class="content-area">
                  <p>类型</p>
                  <select domPropsValue={this.currentItem.type} onChange={(e) => this.currentItem.type = e.target.value}>
                    <option value="html">HTML</option>
                    <option value="api">API</option>
										<option value="rss">RSS</option>
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
                            return (
                              <li>
                                <label>{name}</label>
                                <input domPropsValue={this.currentItem.selectors[name]} onChange={e => this.currentItem.selectors[name] = e.target.value}/>
                              </li>
                            )
                          } )}
                        </ul>
                      </div>
                    )
                  }
                </div>
                <div class="action-area">
                  <button  onClick={() => this.showModals.edit = false}>取消</button>
                  <button onClick={() => this.saveItemForm()}>确定</button>
                </div>
              </div>
            </Modal>
          )
        }
        {
          this.showModals.exportData && (
            <Modal slot="modalContent">
              <div>
                <h3>导出</h3>
                <div class="close-button"  onClick={() => this.showModals.exportData = false}></div>
                <div class="content-area">
                  <textarea id="exportData"></textarea>
                </div>
                <button onClick={() => {
                  document.getElementById('exportData').select()
                  document.execCommand("Copy")
                }}>复制</button>
              </div>
            </Modal>
          )
        }
      </div>
    )
  }
})
