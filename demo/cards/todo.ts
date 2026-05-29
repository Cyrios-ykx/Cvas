import { CanvasNode, TextNode } from '../../src'
import type { App } from '../../src/core'

/**
 * Todo List 卡片
 */
export function createTodoCard(app: App): CanvasNode {
  const todoCard = new CanvasNode({
    display: 'flex',
    flexDirection: 'column',
    padding: [20, 24],
    background: '#ffffff',
    borderRadius: 12,
    gap: 12,
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowBlur: 12,
    shadowOffsetY: 4
  })

  const todoTitle = new TextNode('📝 Todo List', {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'left'
  })

  // Todo 数据
  const todos = [
    { text: '待办1', done: true },
    { text: '待办2', done: true },
    { text: '待办3', done: true },
    { text: '待办4', done: false },
    { text: '待办5', done: false }
  ]

  // 创建 Todo 项
  const todoItems: { row: CanvasNode; label: TextNode; done: boolean }[] = []

  for (const todo of todos) {
    const row = new CanvasNode({
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      height: 36,
      padding: [6, 12],
      background: todo.done ? '#f0fdf4' : '#fafafa',
      borderRadius: 6,
      cursor: 'pointer'
    })
    row.hoverStyle = { background: todo.done ? '#dcfce7' : '#f0f0f0' }

    const checkbox = new TextNode(todo.done ? '✅' : '⬜', {
      fontSize: 16,
      textAlign: 'left'
    })

    const label = new TextNode(todo.text, {
      fontSize: 14,
      color: todo.done ? '#16a34a' : '#333333',
      textAlign: 'left'
    })

    row.append(checkbox, label)
    todoItems.push({ row, label, done: todo.done })

    // 点击切换完成状态
    row.on('click', () => {
      const item = todoItems.find(t => t.row === row)!
      item.done = !item.done
      checkbox.text = item.done ? '✅' : '⬜'
      item.label.setStyle({ color: item.done ? '#16a34a' : '#333333' })
      row.setStyle({ background: item.done ? '#f0fdf4' : '#fafafa' })
      row.hoverStyle = { background: item.done ? '#dcfce7' : '#f0f0f0' }
      app.scheduleRender()
    })

    todoCard.append(row)
  }

  // 在最前面插入标题
  todoCard.children.unshift(todoTitle)
  todoTitle.parent = todoCard

  return todoCard
}
