import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import { RoundToFixDecimals } from "lib/utils"
import TextLog from "components/TextLog"

function DraggableMarker({ initialPos, addCircle }) {
  const [position, setPosition] = useState(initialPos)
  const markerRef = useRef(null)
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        const pos = marker.getLatLng()
        if (addCircle) addCircle(pos)
        if (marker) setPosition(pos)
      },
    }),
    [addCircle],
  )

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}>
      <Popup minWidth={90}>
        {`lat: ${position.lat}`}<br />{`long: ${position.lng}`}
      </Popup>
    </Marker>
  )
}

function MapInput({ supabase, clientRef, center, zoom }) {
  const [log, setLog] = useState(undefined)
  const [circles, setCircles] = useState([])

  useEffect(() => {
    let newLog = `Ref: ${clientRef}\nReady to send location...`
    newLog += circles.map(item => { return `\nsent lat=${RoundToFixDecimals(item.lat)} long=${RoundToFixDecimals(item.lng)}` })
    setLog(newLog)
  }, [circles, clientRef])

  const onAddCircle = useCallback(
    async (pos) => {
      setCircles([...circles, pos])

      // insert new location
      await supabase
        .from('locations')
        .insert([
          { latitude: pos.lat, longitude: pos.lng, ref: clientRef },
        ])
    },
    [setCircles, circles, supabase, clientRef]
  );

  function renderCircles() {
    return circles.map((item, index) => <Circle key={`${index}`} center={item} pathOptions={{ fillColor: 'blue' }} radius={20} />)
  }

  return (
    <div className="map-input">
      <MapContainer center={center} zoom={zoom || 15} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggableMarker initialPos={center} addCircle={onAddCircle} />
        {renderCircles()}
      </MapContainer>
      <TextLog log={log} />

      <style jsx>{`
        .map-input {
        }

        .map-input textarea {
          width: 100%;
          height: 7rem;
        }
      `}</style>
    </div>
  )
}
export default MapInput