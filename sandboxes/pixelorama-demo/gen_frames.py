import os

W, H = 64, 64
out_dir = r"G:\AnimationLab\sandboxes\pixelorama-demo"

# Palette RGB
BG = (0, 0, 0) # transparent-ish key or dark navy
NAVY = (18, 22, 42)
SKIN = (240, 198, 165)
HAIR = (40, 48, 92)
ARMOR = (74, 134, 232)
ARMOR_HI = (140, 200, 255)
CAPE = (204, 41, 54)
BLADE = (225, 250, 255)
GLOW = (56, 232, 255)
BOOT = (45, 35, 50)

def make_frame(f):
    img = [[NAVY for _ in range(W)] for _ in range(H)]
    def rect(x0, y0, w, h, c):
        for y in range(max(0, y0), min(H, y0+h)):
            for x in range(max(0, x0), min(W, x0+w)):
                img[y][x] = c
    bob = [0, -1, 0, 1][f]
    cape_dx = [0, -2, -4, -1][f]
    # Ground shadow
    rect(20, 56, 24, 3, (10, 12, 24))
    # Cape
    rect(16 + cape_dx, 26 + bob, 10, 20, CAPE)
    rect(14 + cape_dx, 32 + bob, 6, 14, CAPE)
    # Legs
    stride = [0, 2, 0, -2][f]
    rect(25 + stride, 44, 5, 11, BOOT)
    rect(33 - stride, 44, 5, 11, BOOT)
    # Body armor
    rect(24, 25 + bob, 16, 19, ARMOR)
    rect(26, 27 + bob, 5, 8, ARMOR_HI)
    # Head + spiky hair
    rect(25, 12 + bob, 14, 13, SKIN)
    rect(24, 9 + bob, 16, 6, HAIR)
    rect(22, 11 + bob, 3, 6, HAIR)
    rect(39, 11 + bob, 3, 5, HAIR)
    # Glowing anime eye
    rect(34, 17 + bob, 4, 2, GLOW)
    # Arm & Katana (animates into forward slash on frame 2)
    if f in (0, 3):
        rect(38, 28 + bob, 8, 4, ARMOR_HI)
        for i in range(14):
            rect(44 + i, 28 + bob - i, 2, 2, BLADE)
    elif f == 1:
        rect(36, 24 + bob, 7, 4, ARMOR_HI)
        for i in range(16):
            rect(41 + i//2, 23 + bob - i, 2, 2, BLADE)
    else:
        rect(40, 30 + bob, 9, 4, ARMOR_HI)
        rect(48, 30 + bob, 15, 3, BLADE)
        rect(48, 28 + bob, 15, 1, GLOW)
        rect(48, 34 + bob, 15, 1, GLOW)

    p = os.path.join(out_dir, f"frame_{f:02d}.ppm")
    with open(p, "wb") as fp:
        fp.write(f"P6\n{W} {H}\n255\n".encode())
        for row in img:
            for r, g, b in row:
                fp.write(bytes((r, g, b)))

for i in range(4):
    make_frame(i)
print("Wrote 4 PPM pixel frames")
