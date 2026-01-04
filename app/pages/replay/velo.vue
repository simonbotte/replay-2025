<script setup lang="ts">
import { computed, ref, type Ref } from "vue";

const frameRef = ref<{
    sectionRef: HTMLElement | null;
    imageRef: HTMLElement | null;
} | null>(null);

onMounted(() => {
    useReplayEntrance(frameRef.value?.sectionRef, frameRef.value?.imageRef);
});
</script>

<template>
    <ReplayFrame ref="frameRef" title="Velo" background-color="#E7EDE6">
        <template #content>
            <div class="flex items-center justify-between">
                <div class="flex flex-col gap-10">
                    <div class="flex gap-10 items-center">
                        <div class="shape-trapezoid flex flex-col items-center justify-center w-fit p-14">
                            <p class="text-6xl w-fit font-semibold text-[#E7EDE6]">2000km</p>
                        </div>
                        <div>
                            <p class="text-4xl">Avec</p>
                            <p class="text-6xl font-semibold">3 velos</p>
                        </div>
                    </div>
                    <div>
                        <p class="text-4xl">Mon</p>
                        <p class="text-6xl font-semibold">Top mois</p>
                    </div>
                    <div class="flex flex-col gap-4">
                        <p class="text-5xl font-bold">Mai</p>
                        <p class="text-5xl font-bold">Novembre</p>
                    </div>
                    <div>
                        <p class="text-4xl">Avec</p>
                        <p class="text-6xl font-semibold">250km/mois</p>
                    </div>
                </div>
            </div>
        </template>

        <template #image>
            <div>
                <img src="/image/velo/moi.png" alt="Moi sur mon velo" />
            </div>
        </template>
    </ReplayFrame>
</template>
