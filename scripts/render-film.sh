#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCENES="$ROOT/public/assets/scenes"
OUT="$ROOT/public/assets/akar-aroma-film.mp4"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

inputs=()
for name in 01-lereng 02-panen 03-jemur 04-sangrai 05-seduh; do
  inputs+=( -i "$SCENES/$name.png" )
done

ffmpeg -hide_banner -y "${inputs[@]}" \
  -filter_complex "
    [0:v]zoompan=z='min(zoom+0.00070,1.12)':x='iw/2-(iw/zoom/2)-on*0.08':y='ih/2-(ih/zoom/2)-on*0.03':d=180:s=1920x1080:fps=30,setsar=1[v0];
    [1:v]zoompan=z='min(zoom+0.00058,1.10)':x='iw/2-(iw/zoom/2)+on*0.07':y='ih/2-(ih/zoom/2)-on*0.05':d=180:s=1920x1080:fps=30,setsar=1[v1];
    [2:v]zoompan=z='if(lte(on,90),1.10-on*0.00065,1.0415+(on-90)*0.00055)':x='iw/2-(iw/zoom/2)+sin(on/34)*7':y='ih/2-(ih/zoom/2)-on*0.025':d=180:s=1920x1080:fps=30,setsar=1[v2];
    [3:v]zoompan=z='min(zoom+0.00072,1.13)':x='iw/2-(iw/zoom/2)-on*0.06':y='ih/2-(ih/zoom/2)+on*0.035':d=180:s=1920x1080:fps=30,setsar=1[v3];
    [4:v]zoompan=z='min(zoom+0.00050,1.09)':x='iw/2-(iw/zoom/2)+on*0.03':y='ih/2-(ih/zoom/2)-on*0.055':d=180:s=1920x1080:fps=30,setsar=1[v4];
    [v0][v1]xfade=transition=smoothleft:duration=1:offset=5[x1];
    [x1][v2]xfade=transition=circleopen:duration=1:offset=10[x2];
    [x2][v3]xfade=transition=smoothup:duration=1:offset=15[x3];
    [x3][v4]xfade=transition=fade:duration=1:offset=20,unsharp=5:5:0.7:5:5:0.0,format=yuv420p[v]
  " \
  -map "[v]" -an -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p \
  -g 12 -keyint_min 12 -sc_threshold 0 -movflags +faststart "$OUT"

ffmpeg -hide_banner -y -i "$SCENES/01-lereng.png" -vf "scale=1536:-2" -frames:v 1 -c:v libwebp -quality 84 "$SCENES/01-lereng.webp"
ffmpeg -hide_banner -y -i "$SCENES/02-panen.png" -vf "scale=1536:-2" -frames:v 1 -c:v libwebp -quality 84 "$SCENES/02-panen.webp"
ffmpeg -hide_banner -y -i "$SCENES/03-jemur.png" -vf "scale=1536:-2" -frames:v 1 -c:v libwebp -quality 84 "$SCENES/03-jemur.webp"
ffmpeg -hide_banner -y -i "$SCENES/04-sangrai.png" -vf "scale=1536:-2" -frames:v 1 -c:v libwebp -quality 84 "$SCENES/04-sangrai.webp"
ffmpeg -hide_banner -y -i "$SCENES/05-seduh.png" -vf "scale=1536:-2" -frames:v 1 -c:v libwebp -quality 84 "$SCENES/05-seduh.webp"

ffprobe -v error -show_entries format=duration,size -show_entries stream=width,height,r_frame_rate -of json "$OUT"
