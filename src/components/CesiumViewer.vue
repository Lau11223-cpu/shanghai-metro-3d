<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import * as Cesium from 'cesium'
import { getMetroLines, getMetroStations } from '../api/metro'

Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN

const containerRef = ref<HTMLDivElement | null>(null)
let viewer: Cesium.Viewer | null = null
let removeSelectionListener: (() => void) | undefined

onMounted(async () => {
  if (!containerRef.value) return
  viewer = new Cesium.Viewer(containerRef.value, {
    terrain: Cesium.Terrain.fromWorldTerrain(),
  })

  // 记录上一次选中的墙体及其原始材质
  let selectedWall: Cesium.WallGraphics | undefined
  let originalMaterial: Cesium.MaterialProperty | undefined

  removeSelectionListener =
    viewer.selectedEntityChanged.addEventListener(
      (entity: Cesium.Entity | undefined) => {
        // 先恢复上一次选中墙体的颜色和透明度
        if (selectedWall) {
          selectedWall.material = originalMaterial
        }

        selectedWall = undefined
        originalMaterial = undefined

        // 如果这次选中的是墙体，将它改成黄色
        if (entity?.wall) {
          selectedWall = entity.wall
          originalMaterial = selectedWall.material

          selectedWall.material = new Cesium.ColorMaterialProperty(
            Cesium.Color.WHITE.withAlpha(0.8),
          )
        }
      },
    )

  const metroData = await getMetroLines()

  console.log('地铁数据：', metroData)
  console.log('线路数量：', metroData.features.length)


  const stationData = await getMetroStations()

  console.log('站点数据：', stationData)
  console.log('站点数量：', stationData.features.length)

  const stationDataSource = await Cesium.GeoJsonDataSource.load(stationData, {
    markerColor: Cesium.Color.WHITE,
    markerSize: 10,
    clampToGround: true,
  })

  await viewer.dataSources.add(stationDataSource)



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
        name: feature.properties?.name || feature.properties?.ref || '地铁线路',
        description: `
          <p>线路编号：${feature.properties?.ref ?? '暂无'}</p>
          <p>运营单位：${feature.properties?.operator ?? '暂无'}</p>
          <p>线路颜色：${feature.properties?.colour ?? '暂无'}</p>
        `,
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
  removeSelectionListener?.()
  removeSelectionListener = undefined

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