import Vue from 'vue'
import Sortable from 'sortablejs'
import { Storage, sleep } from './modules/utils'
import Modal from './modal.js'
Vue.config.productionTip = false
Vue.config.devtools = false

let sortable
var app = new Vue({
  el: '#app',
  data: {
    apiData: null,
    currentId: null,
    currentItem: null,
    showModals: {
      edit: false,
      import: false,
      export: false
    },
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
      this.showModals.edit = false
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
      this.showModals.edit = true
    },
    deleteItem(index) {
      if (!confirm(`确认删除${this.apiData[index].name}？`)) return
      const child = document.querySelector(`[data-id='${index}']`)
      child.parentElement.removeChild(child)
      sortable.save()
    },
    showItem(item, index) {
      this.showModals.edit = true
      this.currentId = index
      this.currentItem = item
    },
    import() {
      let input = prompt('将 JSON 格式的内容粘贴到输入框')
      this.apiData = JSON.parse(input)
      chrome.storage.sync.set({ apiData: JSON.parse(input) })
    },
    async export() {
      this.showModals.export = true
      await sleep(200)
      console.log(this.apiData[0].name)
      document.getElementById('export').value = JSON.stringify(this.apiData)
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
          // TODO: bug 排序后 self.apiData 没变，影响导出
          // self.apiData = newApiData
          console.log('trigger save')
          chrome.storage.sync.set({ apiData: newApiData })
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
            <button onClick={this.import.bind(this)}>导入</button>
            <button onClick={this.export.bind(this)}>导出</button>
            <button onClick={this.clearStorage.bind(this)}>清空</button>
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
                  <button onClick={this.saveItemForm.bind(this)}>确定</button>
                </div>
              </div>
            </Modal>
          )
        }
        {
          this.showModals.export && (
            <Modal slot="modalContent">
              <div>
                <h3>导出</h3>
                <div class="close-button"  onClick={() => this.showModals.export = false}></div>
                <div class="content-area">
                  <textarea id="export"></textarea>
                </div>
                <button onClick={() => {
                  document.getElementById('export').select()
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
