<<<<<<< HEAD
# YomuNavi 日语学习 MVP

## 启动
```bash
cd /Users/RiRosen/Documents/Playground/japanese-study-mvp
python3 -m http.server 8080
```

浏览器打开：

`http://localhost:8080`

## 当前功能
- 学习模式：查看词条、例句，按认识/不熟推进
- 测验模式：4 选 1 词义题
- 复习模式：按到期词条复习
- SRS：答对升级盒子，答错重置，基于间隔复习
- 进度：今日学习数、连续打卡、待复习数
- 发音：本地日语语音（单词/例句点读 + 自动发音）

## 数据与状态
- 词库：`data.js`（当前为 N5 样例词）
- 学习状态：浏览器 `localStorage`（key: `yomunavi-mvp-state`）

## 导入开源词库（Japanese-Chinese-thesaurus）
1. 下载仓库里的 `final.json` 到项目目录，例如：`/Users/RiRosen/Documents/Playground/japanese-study-mvp/final.json`
2. 执行：
```bash
cd /Users/RiRosen/Documents/Playground/japanese-study-mvp
python3 tools/import_jc_thesaurus.py --input ./final.json --output ./imported_vocab.json
```
3. 生成后，应用的“词典”页面会自动读取 `imported_vocab.json`（无需手动粘贴到 `data.js`）。

## 接入 JLPT 分级表（让 N5~N1 筛选准确）
准备一个分级文件（`json/csv/tsv`），至少包含字段：
- `ja`（单词）
- `jlpt`（N5/N4/N3/N2/N1）
- 可选：`kana`

执行：
```bash
cd /Users/RiRosen/Documents/Playground/japanese-study-mvp
python3 tools/merge_jlpt_map.py --base ./imported_vocab.json --map ./jlpt_map.csv --output ./jlpt_vocab.json
```

生成 `jlpt_vocab.json` 后，词典会优先读取它。

## 发音说明
- 如果首次无声，先手动点击一次“发音：单词”按钮，浏览器通常会在用户交互后启用语音。
=======
# japanese-learning-app
A Japanese language learning mobile app for conversation and grammar practice.
>>>>>>> d38f4ebd14f8cd6878570ea6910243e6ad4c1506
