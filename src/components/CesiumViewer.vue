<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import * as Cesium from 'cesium'
import { getMetroLines } from '../api/metro'

Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN

const containerRef = ref<HTMLDivElement | null>(null)
let viewer: Cesium.Viewer | null = null

onMounted(async () => {
  if (!containerRef.value) return
  viewer = new Cesium.Viewer(containerRef.value, {
    terrain: Cesium.Terrain.fromWorldTerrain(),
  })

  const metroData = await getMetroLines()

  console.log('地铁数据：', metroData)
  console.log('线路数量：', metroData.features.length)

  const metroDataSource = await Cesium.GeoJsonDataSource.load(metroData, {
  stroke: Cesium.Color.RED,
  strokeWidth: 4,
  clampToGround: true,
  })

  for (const entity of metroDataSource.entities.values) {
  const properties = entity.properties?.getValue(Cesium.JulianDate.now())
  const lineColor = Cesium.Color.fromCssColorString(properties?.colour)

  if (entity.polyline && lineColor) {
    entity.polyline.material =
      new Cesium.ColorMaterialProperty(lineColor)
    }
  }

  await viewer.dataSources.add(metroDataSource)




  for (const feature of metroData.features) {
    const wallColor =
      Cesium.Color.fromCssColorString(feature.properties?.colour) ??
      Cesium.Color.RED

    const lines =
      feature.geometry.type === 'MultiLineString'
        ? feature.geometry.coordinates
        : [feature.geometry.coordinates]

    for (const coordinates of lines) {
      if (coordinates.length < 2) continue

      const positions = coordinates.map(
        ([longitude, latitude]: number[]) =>
          Cesium.Cartesian3.fromDegrees(longitude, latitude),
      )

      viewer.entities.add({
        wall: {
          positions,
          minimumHeights: new Array(positions.length).fill(0),
          maximumHeights: new Array(positions.length).fill(150),
          material: wallColor.withAlpha(0.35),
        },
      })
    }
  }






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