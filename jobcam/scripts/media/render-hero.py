# Rebuild from owner-supplied IMG_5601.mov and the actual-app recording.
# Usage: python3 scripts/media/render-hero.py <source-mov-or-retained> <recording-dir>
# Use retained to keep the already encoded owner-supplied field loops.
from pathlib import Path
import sys, subprocess, json, shutil, re

source, work = Path(sys.argv[1]), Path(sys.argv[2])
public = Path(__file__).resolve().parents[2] / "public" / "beta"
public.mkdir(exist_ok=True)


def run(*args):
    subprocess.run(
        ["ffmpeg", "-nostdin", "-y", "-v", "error", *map(str, args)], check=True
    )


if str(source) != "retained":
    # One 12-second natural-speed excerpt. Blend the last second into the first
    # before the middle section, producing an 11-second loop with matching ends.
    graph = (
        "[0:v]fps=24,scale=960:-2,crop=960:540,setsar=1,split=3[h][m][t];"
        "[h]trim=start=0:end=1,setpts=PTS-STARTPTS[head];"
        "[m]trim=start=1:end=11,setpts=PTS-STARTPTS[mid];"
        "[t]trim=start=11:end=12,setpts=PTS-STARTPTS[tail];"
        "[tail][head]xfade=transition=fade:duration=1:offset=0[seam];"
        "[seam][mid]concat=n=2:v=1:a=0,format=yuv420p[out]"
    )
    run(
        "-ss",
        40,
        "-i",
        source,
        "-t",
        12,
        "-filter_complex",
        graph,
        "-map",
        "[out]",
        "-an",
        "-map_metadata",
        "-1",
        "-c:v",
        "libx264",
        "-preset",
        "slow",
        "-crf",
        28,
        "-pix_fmt",
        "yuv420p",
        "-color_primaries",
        "bt709",
        "-color_trc",
        "bt709",
        "-colorspace",
        "bt709",
        "-movflags",
        "+faststart",
        public / "hero-field.mp4",
    )
    run(
        "-ss",
        4.5,
        "-i",
        public / "hero-field.mp4",
        "-frames:v",
        1,
        "-q:v",
        3,
        public / "hero-field-poster.jpg",
    )
    # Keep the first-person framing on tall phone heroes instead of recropping
    # the already-wide desktop delivery.
    mobile_graph = graph.replace(
        "scale=960:-2,crop=960:540", "scale=540:-2,crop=540:960"
    )
    run(
        "-ss",
        40,
        "-i",
        source,
        "-t",
        12,
        "-filter_complex",
        mobile_graph,
        "-map",
        "[out]",
        "-an",
        "-map_metadata",
        "-1",
        "-c:v",
        "libx264",
        "-preset",
        "slow",
        "-crf",
        29,
        "-pix_fmt",
        "yuv420p",
        "-color_primaries",
        "bt709",
        "-color_trc",
        "bt709",
        "-colorspace",
        "bt709",
        "-movflags",
        "+faststart",
        public / "hero-field-mobile.mp4",
    )
    run(
        "-ss",
        4.5,
        "-i",
        public / "hero-field-mobile.mp4",
        "-frames:v",
        1,
        "-q:v",
        3,
        public / "hero-field-mobile-poster.jpg",
    )
if (work / "recording.json").exists():
    # Recorder start differs from the wall clock. Align the unique scope-editor
    # screenshot instead of a long static opening (whose codec quality settles).
    recording = json.loads((work / "recording.json").read_text())
    stats = work / "scene-3-ssim.txt"
    run(
        "-i",
        work / "app-session.webm",
        "-loop",
        1,
        "-i",
        work / "scene-3.png",
        "-filter_complex",
        f"[0:v]fps=24,format=yuv420p[a];[1:v]fps=24,format=yuv420p[b];[a][b]ssim=stats_file={stats}:shortest=1",
        "-an",
        "-f",
        "null",
        "-",
    )
    scores = [
        (int(n), float(score))
        for n, score in re.findall(r"n:(\d+).*?All:([\d.]+)", stats.read_text())
    ]
    frame, score = max(scores, key=lambda row: row[1])
    if score < 0.95:
        raise RuntimeError("Recording alignment needs visual review")
    start = max(0, (frame - 1) / 24 - recording["phases"][2]["at"])
    (work / "opening-frame.json").write_text(
        json.dumps({"start": start, "ssim": score, "fps": 24}) + "\n"
    )
    run(
        "-ss",
        start,
        "-i",
        work / "app-session.webm",
        "-t",
        recording["duration"],
        "-vf",
        "fps=24,scale=390:780,setsar=1,tpad=stop_mode=clone:stop_duration=0.5,format=yuv420p",
        "-an",
        "-map_metadata",
        "-1",
        "-c:v",
        "libx264",
        "-preset",
        "slow",
        "-crf",
        24,
        "-movflags",
        "+faststart",
        public / "hero-app.mp4",
    )
    shutil.copyfile(work / "app-poster.png", public / "hero-app-poster.png")
    timeline = Path(__file__).resolve().parents[2] / "src/lib/heroDemo.ts"
    timeline.write_text(
        "// Generated from the real app recording; sample company and rates.\nexport const HERO_DEMO_PHASES = "
        + json.dumps(recording["phases"], indent=2)
        + " as const\n"
    )
print("Rendered silent SDR H.264 hero assets without audio or location metadata.")
