<script setup lang="ts">
import { Swiper, SwiperSlide } from "swiper/vue";
import { Autoplay } from "swiper/modules";

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
const frameRef = ref<{
    sectionRef: HTMLElement | null;
    imageRef: HTMLElement | null;
} | null>(null);

onMounted(() => {
    useReplayEntrance(frameRef.value?.sectionRef, frameRef.value?.imageRef);
});
</script>

<template>
    <ReplayFrame ref="frameRef" title="Cinema">
        <template #content>
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
                <div
                    class="shape-flower flex flex-col items-center justify-center aspect-square w-fit p-10 bg-rotate-45"
                >
                    <p class="text-6xl w-fit font-semibold">61</p>
                    <p class="text-6xl w-fit font-semibold">seances</p>
                    <br />
                </div>
            </div>
        </template>

        <template #image>
            <Swiper v-bind="sliderOptions" class="cinema-slider" :modules="modules">
                <SwiperSlide v-for="slide in slides" :key="slide.src">
                    <img :src="slide.src" :alt="slide.alt" class="cinema-slide-image" />
                </SwiperSlide>
            </Swiper>
        </template>
    </ReplayFrame>
</template>
