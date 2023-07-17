// 操作节点

export const nodeOps = {
  // 创建元素
  createElement: tagName => document.createElement(tagName),
  remove: child => { // 删除
    let parent = child.parentNode
    if (parent) {
      parent.removeChild(child)
    }
  },
  insert: (child, parent, ancher = null) => { // 插入
    parent.insertBefore(child, ancher)
  },
  querySelector: select => document.querySelector(select),
  setElementText: (el, text) => el.textContent = text,
  // 文本
  createText: text => document.createTextNode(text),
  setText: (node, text) => node.nodeValue = text
}