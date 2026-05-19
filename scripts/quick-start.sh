#!/bin/bash
set -e

echo "=================================="
echo " agent-voice 快速启动"
echo "=================================="

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "[1/2] 安装依赖..."
npm install

echo ""
echo "[2/2] 编译项目..."
npm run build

echo ""
echo "=================================="
echo " 启动完成！"
echo "=================================="
echo ""
echo "请确保已配置:"
echo "  - .trae/mcp.json       (MCP 服务)"
echo "  - .trae/skills/        (行为约定)"
echo "  - ~/.agent-voice/      (配置文件，可选)"
echo ""
echo "然后重启 Trae 即可使用。"
