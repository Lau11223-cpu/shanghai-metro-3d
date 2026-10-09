import axios from 'axios'

export async function getMetroLines() {
  const response = await axios.get(
    'http://localhost:3000/api/metro/lines',
  )

  return response.data
}