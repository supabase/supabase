#!/usr/bin/env bash

ONNX_VERSION=$1
ONNX_OS=$2
TARGETPLATFORM=$3
SAVE_PATH=${4:-"./onnx-runtime"}

ONNX_DOWNLOAD_FILE="onnxruntime-$ONNX_OS"
ONNX_TARGET_PLATFORM=$([ "$TARGETPLATFORM" == "linux/arm64" ] && echo "aarch64" \
  || ([ "$TARGETPLATFORM" == "linux/amd64" ] && echo "x64" || echo $TARGETPLATFORM))

if [[ $* == *"--gpu"* ]]; then
  ONNX_DOWNLOAD_FILE="$ONNX_DOWNLOAD_FILE-$ONNX_TARGET_PLATFORM-gpu-$ONNX_VERSION"
else
  ONNX_DOWNLOAD_FILE="$ONNX_DOWNLOAD_FILE-$ONNX_TARGET_PLATFORM-$ONNX_VERSION"
fi

wget -qO- "https://github.com/microsoft/onnxruntime/releases/download/v${ONNX_VERSION}/${ONNX_DOWNLOAD_FILE}.tgz" | tar zxv

mv "$ONNX_DOWNLOAD_FILE" "$SAVE_PATH"
