import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'HJSON Topology Toolkit',
  description: '强大的 HJSON/JSON 拓扑结构处理工具包',
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: '示例', link: '/examples/' }
    ],
    
    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '介绍', link: '/guide/introduction' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装', link: '/guide/installation' }
          ]
        },
        {
          text: '核心功能',
          items: [
            { text: '遍历', link: '/guide/traverse' },
            { text: '查找', link: '/guide/find' },
            { text: '转换', link: '/guide/transform' },
            { text: '验证', link: '/guide/validate' },
            { text: 'HJSON 支持', link: '/guide/hjson' }
          ]
        },
        {
          text: '高级用法',
          items: [
            { text: '链式 API', link: '/guide/chain' },
            { text: '异步操作', link: '/guide/async' },
            { text: '性能优化', link: '/guide/performance' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '概览', link: '/api/' }
          ]
        },
        {
          text: '遍历',
          items: [
            { text: 'bfs / dfs', link: '/api/traverser' }
          ]
        },
        {
          text: '查找',
          items: [
            { text: 'find / findAll', link: '/api/finder' }
          ]
        },
        {
          text: '转换',
          items: [
            { text: 'map / filter / reduce', link: '/api/transformer' }
          ]
        },
        {
          text: '验证',
          items: [
            { text: 'validate', link: '/api/validator' }
          ]
        },
        {
          text: 'HJSON',
          items: [
            { text: 'parse / stringify', link: '/api/hjson' }
          ]
        },
        {
          text: '异步',
          items: [
            { text: 'async API', link: '/api/async' }
          ]
        }
      ]
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/yourusername/hjson-topology-toolkit' }
    ],
    
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present'
    },
    
    editLink: {
      pattern: 'https://github.com/yourusername/hjson-topology-toolkit/edit/main/docs/:path'
    },
    
    search: {
      provider: 'local'
    }
  },
  
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true
  },
  
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3c3c43' }]
  ]
})
