import Vue from 'vue'
import Sortable from 'sortablejs'
import { Storage, sleep } from './modules/utils'
Vue.config.productionTip = false
Vue.config.devtools = false

let sortable
var app = new Vue({
  el: '#app',
  data: {
    apiData: null,
    currentId: null,
    currentItem: null,
		showModal: false,
  },
  methods: {
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
    clearStorage() {
      if (!confirm('确认清除')) return
      this.apiData = null
      chrome.storage.sync.set({ apiData: null })
    },
    saveItemForm() {
      this.apiData[this.currentId] = this.currentItem
      chrome.storage.sync.set({ apiData: this.apiData })
      this.showModal = false
    },
    addItem() {
      this.currentId = this.apiData.length
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
      this.showModal = true
    },
    deleteItem(index) {
      if (!confirm(`确认删除${this.apiData[index].name}？`)) return
      const child = document.querySelector(`[data-id='${index}']`)
      child.parentElement.removeChild(child)
      sortable.save()
    },
    showItem(item, index) {
      this.showModal = true
      this.currentId = index
      this.currentItem = item
    }
  },
  computed: {
  },
  mounted () {
    this.getApiData()
    const self = this
		const el = document.getElementById('items')
    sortable = Sortable.create(el, {
      store: {
        get() {
          return []
        },
        set(sortable) {
          const order = sortable.toArray();
          let newApiData = []
          order.forEach(key => newApiData.push(self.apiData[key]))
          chrome.storage.sync.set({ apiData: newApiData })
          // console.log(newApiData)
        }
      },
      onSort(evt) {
        // console.log(evt, self.apiData)
        this.save()
      }
    })
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
            <button>导入</button>
            <button>导出</button>
            <button onClick={this.clearStorage.bind(this)}>清空存储</button>
          </div>
          <div class="content">
            <ul id="items" class="items">
              {
                this.apiData && this.apiData.map((item, index) => {
                  return (
                    <li class="item" data-id={index}>
                      <div class="itemInner">
                        <img class="logo" src={item.icon} />
                        <div class="itemMain">
                          <div class="itemTitle">{item.name}</div>
                          <div class="itemUrl">{item.url}</div>
                        </div>
                        <div class="action edit" onClick={this.showItem.bind(this, item, index)}>编辑</div>
                        <div class="action" onClick={this.deleteItem.bind(this, index)}>删除</div>
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
