<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        kicker?: string;
        title: string;
        backgroundColor?: string;
    }>(),
    {
        kicker: "Mon replay",
        backgroundColor: "#FBEAD5",
    }
);

const sectionRef = ref<HTMLElement | null>(null);
const imageRef = ref<HTMLElement | null>(null);

defineExpose({ sectionRef, imageRef });
</script>

<template>
    <div class="relative">
        <section
            ref="sectionRef"
            class="w-[1080px] h-[1920px] m-auto flex flex-col justify-between gap-10 overflow-hidden"
            :style="{ backgroundColor: props.backgroundColor }"
        >
            <div class="p-11">
                <div>
                    <span class="text-6xl">{{ props.kicker }}</span>
                    <h1 class="text-9xl font-extrabold">{{ props.title }}</h1>
                </div>

                <slot name="content" />
            </div>

            <div ref="imageRef">
                <slot name="image" />
            </div>
        </section>
    </div>
</template>
