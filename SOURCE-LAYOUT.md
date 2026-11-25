# AnimationLab source repository (Windows / RTX 4060)

This **public source repository** tracks the AnimationLab production pipeline, director and specialist skills, Windows launchers, templates, renderer demos and benchmark *code*. It is designed for the original Windows install at `G:\AnimationLab\`; authored video projects and renders remain local. Do not assume GitHub includes their media or outputs.

## Restore the source and optional skill packs

```powershell
git clone https://github.com/gad4523-maker/animationlab.git G:\AnimationLab
cd G:\AnimationLab
git submodule update --init --recursive
```

If the repo already exists, run `git pull --ff-only` on the correct branch and `git submodule update --init --recursive`. **Do not clone into an existing nonempty `G:\AnimationLab`**: preserve user projects, assets and changes; bring source updates into the live installation carefully.

Submodules pin upstream sources but **do not install Windows binaries, Blender add-ons, model weights or Python/Node dependencies**. Follow `README.md`, `pipeline/LICENSES_AND_DEPS.md` and `docs/ANIMATION_SKILLS.md`. Do not run third-party installers blindly.

[AnimationLab Portable](https://github.com/gad4523-maker/animationlab-portable) is the smaller CPU-friendly repo for Gemini Tasks.
