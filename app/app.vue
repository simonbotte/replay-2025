<script setup lang="ts">
import { Swiper, SwiperSlide } from "swiper/vue";
import { Autoplay } from "swiper/modules";
import { gsap } from "gsap";
import { onBeforeUnmount, onMounted, ref } from "vue";

const sliderOptions = useCinemaSlider();
const slides = [
    { src: "/image/cinema/f1.png", alt: "Affiche film F1" },
    { src: "/image/cinema/sinners-2.jpg", alt: "Affiche film Sinners" },
    { src: "/image/cinema/obaa.png", alt: "Affiche film One battle after another" },
    { src: "/image/cinema/f1.png", alt: "Affiche film F1" },
    { src: "/image/cinema/sinners-2.jpg", alt: "Affiche film Sinners" },
    { src: "/image/cinema/obaa.png", alt: "Affiche film One battle after another" },
];

const modules = [Autoplay];

const sectionRef = ref<HTMLElement | null>(null);
const sliderRef = ref<HTMLElement | null>(null);
let ctx: gsap.Context | null = null;

onMounted(() => {
    if (!sectionRef.value) {
        return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }
    ctx = gsap.context(() => {
        const textElements = sectionRef.value?.querySelectorAll(
            "h1, h2, h3, h4, h5, h6, p, span, li, figcaption, small, strong, em, a"
        );
        const flowerElement = sectionRef.value?.querySelector(".shape-flower");
        const timeline = gsap.timeline();
        const holdDelay = gsap.delayedCall(4, () => timeline.reverse()).pause();

        if (textElements && textElements.length > 0) {
            timeline.from(textElements, {
                opacity: 0,
                y: 12,
                duration: 1.5,
                ease: "power2.out",
                stagger: 0.08,
                clearProps: "transform,opacity",
            });
        }
        if (flowerElement) {
            timeline.from(
                flowerElement,
                {
                    opacity: 0,
                    duration: 1.2,
                    ease: "power2.out",
                    clearProps: "opacity",
                },
                0.1
            );
        }
        if (sliderRef.value) {
            const sliderStart = textElements && textElements.length > 0 ? 0.35 : 0;
            timeline.from(
                sliderRef.value,
                {
                    opacity: 0,
                    y: 1000,
                    duration: 1.3,
                    ease: "power3.out",
                    clearProps: "transform,opacity",
                },
                sliderStart
            );
        }

        if (timeline.duration() > 0) {
            timeline.eventCallback("onComplete", () => {
                holdDelay.restart(true);
            });
        }
    }, sectionRef.value);
});

onBeforeUnmount(() => {
    ctx?.revert();
});
</script>

<template>
    <div class="relative">
        <section
            ref="sectionRef"
            class="w-[1080px] h-[1920px] m-auto bg-[#FBEAD5] flex flex-col justify-between gap-10 overflow-hidden"
        >
            <div class="p-11">
                <div>
                    <span class="text-6xl">Mon replay</span>
                    <h1 class="text-9xl font-extrabold">Cinema</h1>
                </div>

                <div class="flex items-center justify-between">
                    <div class="flex flex-col gap-10">
                        <div>
                            <p class="text-4xl">MON</p>
                            <p class="text-6xl font-semibold">TOP 2025</p>
                        </div>

                        <div class="flex flex-col gap-4">
                            <p class="text-5xl font-bold">SINNERS</p>
                            <p class="text-5xl font-bold">ONE BATTLE AFTER ANOTHER</p>
                            <p class="text-5xl font-bold">F1</p>
                        </div>
                    </div>
                    <div class="shape-flower flex flex-col items-center justify-center aspect-square w-fit p-10 bg-rotate-45">
                        <p class="text-6xl w-fit font-semibold">61</p>
                        <p class="text-6xl w-fit font-semibold">seances</p>
                        <br />
                    </div>
                </div>
            </div>

            <div ref="sliderRef">
                <Swiper v-bind="sliderOptions" class="cinema-slider" :modules="modules">
                    <SwiperSlide v-for="slide in slides" :key="slide.src">
                        <img :src="slide.src" :alt="slide.alt" class="cinema-slide-image" />
                    </SwiperSlide>
                </Swiper>
            </div>
        </section>
    </div>
</template>
