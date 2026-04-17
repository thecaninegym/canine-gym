#!/bin/bash
# The Canine Gym - Live Stream Script
# Runs on Raspberry Pi Zero 2 W
# Polls the app API for active streams and pushes camera feed to Mux

API_URL="https://app.thecaninegym.com/api/live-stream/status"
CAMERA_URL="rtsp://admin:ElodieRose1!@192.168.1.101:554/h264Preview_01_main"
POLL_INTERVAL=5
FFMPEG_PID=""
CURRENT_KEY=""

cleanup() {
    echo "[$(date)] Shutting down..."
    if [ -n "$FFMPEG_PID" ] && kill -0 "$FFMPEG_PID" 2>/dev/null; then
        kill "$FFMPEG_PID"
        echo "[$(date)] FFmpeg stopped"
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

start_stream() {
    local stream_key="$1"
    echo "[$(date)] Starting stream to Mux..."
    ffmpeg -i "$CAMERA_URL" \
        -c:v copy \
        -c:a aac \
        -f flv \
        "rtmps://global-live.mux.com:443/app/$stream_key" \
        > /dev/null 2>&1 &
    FFMPEG_PID=$!
    CURRENT_KEY="$stream_key"
    echo "[$(date)] FFmpeg started with PID $FFMPEG_PID"
}

stop_stream() {
    if [ -n "$FFMPEG_PID" ] && kill -0 "$FFMPEG_PID" 2>/dev/null; then
        kill "$FFMPEG_PID"
        echo "[$(date)] FFmpeg stopped"
    fi
    FFMPEG_PID=""
    CURRENT_KEY=""
}

echo "[$(date)] The Canine Gym Stream Service started"
echo "[$(date)] Polling $API_URL every ${POLL_INTERVAL}s"

while true; do
    response=$(curl -s "$API_URL" 2>/dev/null)
    active=$(echo "$response" | grep -o '"active":true')
    stream_key=$(echo "$response" | grep -o '"streamKey":"[^"]*"' | cut -d'"' -f4)

    if [ -n "$active" ] && [ -n "$stream_key" ]; then
        # Stream should be active
        if [ "$stream_key" != "$CURRENT_KEY" ]; then
            # New stream or different key - stop old, start new
            stop_stream
            start_stream "$stream_key"
        elif [ -n "$FFMPEG_PID" ] && ! kill -0 "$FFMPEG_PID" 2>/dev/null; then
            # FFmpeg crashed, restart
            echo "[$(date)] FFmpeg crashed, restarting..."
            start_stream "$stream_key"
        fi
    else
        # No active stream
        if [ -n "$CURRENT_KEY" ]; then
            echo "[$(date)] Stream ended"
            stop_stream
        fi
    fi

    sleep "$POLL_INTERVAL"
done
