"""Generate gallery/manifest_data.js from manifest.json for zero-CORS file:/// playback."""
import json
from pathlib import Path

ROOT = Path(r"G:\AnimationLab\StyleBenchmark")
MANIFEST = ROOT / "manifest.json"
OUT_JS = ROOT / "gallery" / "manifest_data.js"


def main():
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    OUT_JS.parent.mkdir(parents=True, exist_ok=True)
    OUT_JS.write_text("window.STYLE_MANIFEST = " + json.dumps(data, ensure_ascii=False) + ";\n", encoding="utf-8")
    completed = sum(1 for s in data["styles"] if s.get("status") == "completed")
    failed = sum(1 for s in data["styles"] if s.get("status") == "failed")
    print(f"Wrote {OUT_JS}: total={len(data['styles'])}, completed={completed}, failed={failed}")


if __name__ == "__main__":
    main()
