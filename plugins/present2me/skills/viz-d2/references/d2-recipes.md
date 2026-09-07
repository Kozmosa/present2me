# D2 图型配方

每个配方都是可运行的最小骨架，按需扩节点。全部建议带上 `vars.d2-config`。

## 1. 流程图

```d2
direction: right
vars: {d2-config: {layout-engine: elk, theme-id: 0}}

开始: {shape: circle}
判断: {shape: diamond, label: 条件满足？}
处理A: 正常路径
处理B: {label: 异常处理, style.fill: mistyrose}
结束: {shape: circle, style.fill: honeydew}

开始 -> 判断
判断 -> 处理A: 是
判断 -> 处理B: 否
处理A -> 结束
处理B -> 判断: 重试
```

## 2. 时序图

```d2
seq: {
  shape: sequence_diagram
  客户端: {shape: person}
  服务端
  数据库: {shape: cylinder}

  客户端 -> 服务端: 登录请求
  服务端 -> 数据库: 查询用户
  数据库 -> 服务端: 返回记录
  服务端 -> 客户端: token
}
```

## 3. 分层架构图

```d2
direction: down
vars: {d2-config: {layout-engine: elk, theme-id: 4}}

客户端层: {
  web: Web 前端
  app: 移动端
}
服务层: {
  网关: {style.fill: "#e8f4f8"}
  业务A
  业务B
}
数据层: {
  主库: {shape: cylinder}
  缓存: {shape: cylinder, style.fill: oldlace}
}

客户端层.web -> 服务层.网关
客户端层.app -> 服务层.网关
服务层.网关 -> 服务层.业务A
服务层.网关 -> 服务层.业务B
服务层.业务A -> 数据层.主库
服务层.业务A -> 数据层.缓存
```

## 4. 方案对比板

```d2
vars: {d2-config: {layout-engine: elk, theme-id: 3}}

对比: {
  grid-columns: 2
  方案A: {
    label: "方案 A：同步处理"
    优点: |md + 简单\\n+ 一致性好|
    缺点: |md - 延迟高\\n- 耦合|
  }
  方案B: {
    label: "方案 B：异步消息"
    优点: |md + 高吞吐\\n+ 解耦|
    缺点: |md - 最终一致\\n- 复杂|
  }
}
```

## 5. C4 风格上下文图

```d2
direction: right
用户: {shape: person}
系统: present2me 工作区 {
  style.multiple: true
}
飞书: {shape: cloud, label: 外部系统}
用户 -> 系统: 讲解/委托
系统 -> 飞书: 文档产出
```

（`shape: cloud` 若当前版本不支持，换 `oval`。）

## 6. 概念解释图（讲解用）

```d2
direction: right
vars: {d2-config: {theme-id: 6, sketch: true}}   # 手绘风更适合讲解

核心概念: {shape: circle, style.fill: honeydew, style.font-size: 24}
要素1 -> 核心概念
要素2 -> 核心概念
核心概念 -> 已知概念: 类比
误区: {shape: diamond, style.fill: mistyrose, label: 常见误解}
误区 -|不是| 核心概念: {style.stroke-dash: 4, target-arrowhead: {shape: none}}
```

> 注意：`-|不是|` 这种写法部分版本不支持，稳妥写法是 `误区 -> 核心概念: 不是` + 虚线。

## 7. 状态机

```d2
direction: right
[*]: {shape: circle}
active: 进行中
paused: 暂停
done: 已完成 {shape: doublecircle 不可用时用 style.multiple: true}
[*] -> active: 开始
active -> paused: 挂起
paused -> active: 恢复
active -> done: 归档
```
