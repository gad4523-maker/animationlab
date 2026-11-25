import argparse
import os
import sys
import time
import cv2
import matplotlib
import numpy as np
import torch

sys.path.insert(0, r"G:\AnimationLab\ai-and-depth\depth-anything-v2")
from depth_anything_v2.dpt import DepthAnythingV2


def main():
    parser = argparse.ArgumentParser(description="AnimationLab Depth Anything V2 Runner")
    parser.add_argument("--img", default=r"G:\AnimationLab\sandboxes\shared-media\test_anime_scene.png")
    parser.add_argument("--ckpt", default=r"G:\AnimationLab\models\depth-anything-v2\depth_anything_v2_vits.pth")
    parser.add_argument("--encoder", default="vits", choices=["vits", "vitb", "vitl"])
    parser.add_argument("--input-size", type=int, default=518)
    parser.add_argument("--outdir", default=r"G:\AnimationLab\test-outputs\11_depth-anything-v2")
    args = parser.parse_args()

    os.makedirs(args.outdir, exist_ok=True)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"PyTorch {torch.__version__} | device={device}")
    if device == "cuda":
        print(f"GPU: {torch.cuda.get_device_name(0)} | CUDA: {torch.version.cuda}")
        torch.cuda.reset_peak_memory_stats()

    configs = {
        "vits": {"encoder": "vits", "features": 64, "out_channels": [48, 96, 192, 384]},
        "vitb": {"encoder": "vitb", "features": 128, "out_channels": [96, 192, 384, 768]},
        "vitl": {"encoder": "vitl", "features": 256, "out_channels": [256, 512, 1024, 1024]},
    }

    t0 = time.perf_counter()
    model = DepthAnythingV2(**configs[args.encoder])
    model.load_state_dict(torch.load(args.ckpt, map_location="cpu", weights_only=True))
    model = model.to(device).eval()
    load_sec = time.perf_counter() - t0

    raw_img = cv2.imread(args.img)
    assert raw_img is not None, f"Failed to read {args.img}"

    # Warmup + timed inference
    with torch.no_grad():
        _ = model.infer_image(raw_img, args.input_size)
        if device == "cuda":
            torch.cuda.synchronize()
        t1 = time.perf_counter()
        depth = model.infer_image(raw_img, args.input_size)
        if device == "cuda":
            torch.cuda.synchronize()
        infer_sec = time.perf_counter() - t1

    peak_vram_mb = (torch.cuda.max_memory_allocated() / (1024 ** 2)) if device == "cuda" else 0.0
    print(f"Load={load_sec:.3f}s | Inference={infer_sec*1000:.1f}ms | PeakVRAM={peak_vram_mb:.1f}MB | Shape={depth.shape} | Range=[{depth.min():.3f}, {depth.max():.3f}]")

    depth_norm = ((depth - depth.min()) / max(1e-6, (depth.max() - depth.min())) * 255.0).astype(np.uint8)
    depth_gray = np.repeat(depth_norm[..., np.newaxis], 3, axis=-1)
    cmap = matplotlib.colormaps.get_cmap("inferno")
    depth_color = (cmap(depth_norm)[:, :, :3] * 255)[:, :, ::-1].astype(np.uint8)

    sep = np.ones((raw_img.shape[0], 24, 3), dtype=np.uint8) * 255
    side_by_side = cv2.hconcat([raw_img, sep, depth_color])

    cv2.imwrite(os.path.join(args.outdir, "depth_gray.png"), depth_gray)
    cv2.imwrite(os.path.join(args.outdir, "depth_inferno.png"), depth_color)
    cv2.imwrite(os.path.join(args.outdir, "depth_side_by_side.png"), side_by_side)
    print(f"Saved outputs to {args.outdir}")


if __name__ == "__main__":
    main()
