import { useEffect, useReducer } from 'react'
import { MapContainer, TileLayer, Polyline } from 'react-leaflet'
import { RoundToFixDecimals } from 'lib/utils'
import { supabase } from 'lib/api'
import TextLog from 'components/TextLog'

export default function MapView({ center, zoom }) {
  const [state, dispatch] = useReducer(mapReducer, initialState)

  useEffect(() => {
    // Listen to INSERT event on locations table
    const subscription = supabase
      .from('locations')
      .on('INSERT', (payload) => {
        console.log('New Position received!', payload)
        dispatch({ payload: payload.new })
      })
      .subscribe()

    return () => {
      if (subscription) supabase.removeSubscription(subscription)
    }
  }, [])

  function drawPolylines() {
    let result = Object.keys(state.userPositions).map((key, idx) => {
      const item = state.userPositions[key]
      if (!item) return

      const { color, data } = item
      const polyline = data.map((item) => {
        if (!item) return
        const { lat, lng } = item
        return [lat, lng]
      })

      return <Polyline key={`line-${idx}`} pathOptions={{ color: color }} positions={polyline} />
    })

    return result
  }

  return (
    <div className="map-view">
      <MapContainer center={center} zoom={zoom || 15} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {drawPolylines()}
      </MapContainer>
      <TextLog log={state.log} />
    </div>
  )
}

function randomColor() {
  var array = ['black', 'magenta', 'blue', 'indigo', 'green', 'blueviolet']
  return array[Math.floor(Math.random() * array.length)]
}

const initialState = {
  log: 'Start listerning...',
  userPositions: {},
}

const mapReducer = (state, action) => {
  const { id, user_id, latitude: lat, longitude: lng } = action.payload
  const position = { id, user_id, lat, lng }

  let positions = state.userPositions[user_id]
  if (positions) positions.data = [...positions.data, position]
  else positions = { color: randomColor(), data: [position] }
  const userPositions = { ...state.userPositions, [user_id]: positions }

  let log = state.log
  log += `\nuser_id=${user_id}`
  log += ` lat=${RoundToFixDecimals(lat)}`
  log += ` long=${RoundToFixDecimals(lng)}`

  return {
    log,
    userPositions,
  }
}
