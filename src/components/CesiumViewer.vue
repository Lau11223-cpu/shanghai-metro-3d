<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import * as Cesium from 'cesium'

Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN

const containerRef = ref<HTMLDivElement | null>(null)
let viewer: Cesium.Viewer | null = null

onMounted(async () => {
  if (!containerRef.value) return
  viewer = new Cesium.Viewer(containerRef.value, {
    terrain: Cesium.Terrain.fromWorldTerrain(),
  })

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(121.4944, 31.2236, 15000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-45),
      roll: 0,
    },
    duration: 5,
  })
})

onBeforeUnmount(() => {
  viewer?.destroy()
  viewer = null
})
</script>

<template>
  <div ref="containerRef" class="cesium-container"></div>
</template>

<style scoped>
.cesium-container {
  width: 100vw;
  height: 100vh;
}
</style>