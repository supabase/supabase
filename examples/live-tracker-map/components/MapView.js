import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline } from 'react-leaflet'
import { RoundToFixDecimals } from "lib/utils"
import TextLog from "components/TextLog"

function MapView({ supabase, clientRef, center, zoom }) {
  const [log, setLog] = useState(undefined)
  const [positions, setPositions] = useState([])
  const mySubscription = useRef(false)

  useEffect(() => {
    let newLog = `Ref: ${clientRef}\nStart listerning...`
    newLog += positions.map(item => { return `\nid=${item.id} lat=${RoundToFixDecimals(item.lat)} long=${RoundToFixDecimals(item.lng)}` })
    setLog(newLog)
  }, [positions, clientRef])

  useEffect(() => {
    // Listen to INSERT event on locations table
    mySubscription.current = supabase
      .from('locations')
      .on('INSERT', payload => {
        const { new: newItem } = payload
        const { id, ref, latitude, longitude } = newItem
        if (ref === clientRef) {
          console.log('Change received!', payload)
          setPositions([...positions, { id, ref, lat: latitude, lng: longitude }])
        }
      })
      .subscribe()

    return () => {
      if (mySubscription.current) supabase.removeSubscription(mySubscription.current)
    }
  }, [supabase, clientRef, positions, setPositions])

  function drawPolyline() {
    const temp = positions.map(item => {
      if (!item) return
      const { lat, lng } = item
      return [lat, lng]
    })
    const polyline = [center, ...temp]
    return <Polyline pathOptions={{ color: 'black' }} positions={polyline} />
  }

  return (
    <div className="map-view">
      <MapContainer center={center} zoom={zoom || 15} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {drawPolyline()}
      </MapContainer>
      <TextLog log={log} />

      <style jsx>{`
        .map-view {
        }
      `}</style>
    </div>
  )
}
export default MapView