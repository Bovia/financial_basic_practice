---
title: 金融基础刷题系统
description: 轻量在线刷题，支持考试模式、错题重练与进度跨设备同步
tags:
  - Next.js
  - TypeScript
  - Prisma
  - PostgreSQL
demoUrl: https://financial-basic-practice.vercel.app
githubUrl: https://github.com/Bovia/financial_basic_practice
date: 2026-06
responsive: "false"
---

## 为什么做这个

备考证券从业「金融基础」时，手头的卷子都是 Markdown 或 App 导出的文本，现有刷题工具要么功能太重，要么没法按自己的节奏练。想做一个只服务这一件事的小工具：打开就能刷，换设备输入用户名还能接着做。

## 它解决了什么

把套卷整理成 JSON 题库，支持练习/考试两种模式、自动下一题和太阳/月亮主题。答完可以看逐题解析，并从结果页一键「刷对题」或「刷错题」，只练需要巩固的那部分，不必每次从头刷满 120 题。

## 一个值得说的技术决定

题库走静态 JSON、进度和答题记录走 Neon + Prisma，部署时改题不用动数据库。更关键的是练习进度支持 `questionIds` 子集：结果页筛出错题 ID，创建一条只含这些题的新 progress，做题页和计分 API 都按子集走，整卷和专项练习共用同一套逻辑。

另外写了一个 Markdown 解析脚本，能自动识别 App 导出和紧凑文本两种格式，新卷子 `npm run parse:md` 即可入库。

## 结果

已部署到 Vercel，自己和同学日常刷题在用。从「导出一套卷 → 解析入库 → 手机上开练」全流程大约十分钟，比手动整理 Excel 省太多事。