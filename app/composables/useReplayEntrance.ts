import { gsap } from "gsap";
import { onMounted, onBeforeUnmount, type Ref } from "vue";

type ReplayEntranceOptions = {
    holdSeconds?: number;
    imageFromY?: number;
};

export const useReplayEntrance = (
    sectionEl: Ref<HTMLElement | null>,
    imageEl?: Ref<HTMLElement | null>,
    { holdSeconds = 4, imageFromY = 1000 }: ReplayEntranceOptions = {}
) => {
    let ctx: gsap.Context | undefined;

    const TEXT_SELECTOR = "h1,h2,h3,h4,h5,h6,p,span,li,figcaption,small,strong,em,a";
    console.log(sectionEl);
    
    const el = sectionEl;
    
    
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    
    ctx = gsap.context(() => {
        const texts = el.querySelectorAll(TEXT_SELECTOR);
        const shape = el.querySelector('[class^="shape"]');
        
        const img = imageEl;

        const tl = gsap.timeline();
        const hold = gsap.delayedCall(holdSeconds, () => tl.reverse()).pause();

        if (texts.length) {
            tl.from(texts, {
                opacity: 0,
                y: 12,
                duration: 1.5,
                ease: "power2.out",
                stagger: 0.08,
                clearProps: "transform,opacity",
            });
        }

        if (shape) {
            tl.from(
                shape,
                {
                    opacity: 0,
                    duration: 1.2,
                    ease: "power2.out",
                    clearProps: "opacity",
                },
                0.1
            );
        }

        if (img) {
            tl.from(
                img,
                {
                    opacity: 0,
                    y: imageFromY,
                    duration: 1.3,
                    ease: "power3.out",
                    clearProps: "transform,opacity",
                },
                texts.length ? 0.35 : 0
            );
        }

        if (tl.duration() > 0) {
            tl.eventCallback("onComplete", () => hold.restart(true));
        }
    }, el);

    onBeforeUnmount(() => {
        ctx?.revert();
    });
};
