import numpy as np
from manimlib import *


class AnimationLabMathDemo(Scene):
    def construct(self):
        title = Text("ManimGL (3Blue1Brown) · Epicycle & Wave Demo", font_size=34, color=TEAL_A)
        title.to_edge(UP)
        subtitle = Text("OpenGL Vector Geometry · Zero LaTeX Mode", font_size=22, color=GREY_B)
        subtitle.next_to(title, DOWN, buff=0.2)
        self.play(FadeIn(title), FadeIn(subtitle), run_time=0.7)

        axes = Axes(
            x_range=(-1.5, 5.5, 1),
            y_range=(-2.0, 2.0, 1),
            width=7.5,
            height=4.2,
        )
        axes.shift(RIGHT * 1.4 + DOWN * 0.4)
        self.play(ShowCreation(axes), run_time=0.6)

        center = LEFT * 4.2 + DOWN * 0.4
        c1 = Circle(radius=1.1, color=BLUE_C, stroke_width=3).move_to(center)
        c2 = Circle(radius=0.45, color=YELLOW_C, stroke_width=2.5)
        dot1 = Dot(color=BLUE_B)
        dot2 = Dot(color=RED_C, radius=0.09)

        t_tracker = ValueTracker(0.0)

        def get_p1():
            th = t_tracker.get_value()
            return center + 1.1 * np.array([np.cos(th), np.sin(th), 0.0])

        def get_p2():
            th = t_tracker.get_value()
            return get_p1() + 0.45 * np.array([np.cos(3 * th), np.sin(3 * th), 0.0])

        dot1.add_updater(lambda m: m.move_to(get_p1()))
        c2.add_updater(lambda m: m.move_to(get_p1()))
        dot2.add_updater(lambda m: m.move_to(get_p2()))

        arm1 = always_redraw(lambda: Line(center, get_p1(), color=BLUE_D, stroke_width=2))
        arm2 = always_redraw(lambda: Line(get_p1(), get_p2(), color=YELLOW_D, stroke_width=2))
        wave_dot = always_redraw(lambda: Dot(
            axes.c2p(t_tracker.get_value() * 0.85, (get_p2()[1] - center[1])),
            color=TEAL_C,
            radius=0.08,
        ))
        connector = always_redraw(lambda: DashedLine(
            get_p2(),
            axes.c2p(t_tracker.get_value() * 0.85, (get_p2()[1] - center[1])),
            color=GREY_C,
            stroke_width=1.5,
        ))

        epicycle_trace = TracedPath(dot2.get_center, stroke_color=RED_B, stroke_width=3)
        wave_trace = TracedPath(wave_dot.get_center, stroke_color=TEAL_B, stroke_width=3.5)

        self.add(c1, c2, arm1, arm2, dot1, dot2, wave_dot, connector, epicycle_trace, wave_trace)
        self.play(t_tracker.animate.set_value(TAU), run_time=2.5, rate_func=linear)
        self.wait(0.4)
