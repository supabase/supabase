import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline } from 'react-leaflet'
import { RoundToFixDecimals } from "lib/Utils"
import TextLog from "components/TextLog"

function randomColor() {
  var array = ["black", "magenta", "blue", "indigo", "green", "blueviolet"];
  return array[Math.floor(Math.random() * array.length)];
}

function MapView({ supabase, center, zoom }) {
  const [log, setLog] = useState(undefined)
  const [positions, setPositions] = useState([])
  const [userPositionsDict, setUserPositionsDict] = useState([])
  const mySubscription = useRef(false)

  useEffect(() => {
    let newLog = `Start listerning...`
    newLog += positions.map(item => { return `\nuser_id=${item.user_id} lat=${RoundToFixDecimals(item.lat)} long=${RoundToFixDecimals(item.lng)}` })
    setLog(newLog)
  }, [positions])

  useEffect(() => {
    // Listen to INSERT event on locations table
    mySubscription.current = supabase
      .from('locations')
      .on('INSERT', payload => {
        console.log('Change received!', payload)
        const { new: newItem } = payload
        const { id, user_id, latitude, longitude } = newItem

        let userPositions = userPositionsDict[user_id]
        if (userPositions) userPositions.data = [...userPositions.data, { id, user_id, lat: latitude, lng: longitude }]
        else userPositions = { color: randomColor(), data: [{ id, user_id, lat: latitude, lng: longitude }] }

        setPositions([...positions, { id, user_id, lat: latitude, lng: longitude }])
        setUserPositionsDict({ ...userPositionsDict, [user_id]: userPositions })
      })
      .subscribe()

    return () => {
      if (mySubscription.current) supabase.removeSubscription(mySubscription.current)
    }
  }, [supabase, positions, setPositions, userPositionsDict, setUserPositionsDict])

  function drawPolylines() {
    // console.log(userPositionsDict)
    function drawPolyline(color, data) {
      const polyline = data.map(item => {
        if (!item) return
        const { lat, lng } = item
        return [lat, lng]
      })
      return <Polyline pathOptions={{ color: color }} positions={polyline} />
    }

    let result = Object.keys(userPositionsDict).map(key => {
      const item = userPositionsDict[key]
      if (!item) return

      const { color, data } = item
      return drawPolyline(color, data)
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
      <TextLog log={log} />
    </div>
  )
}
export default MapView