function FeatureColumn({ icon, title, text }: any) {
  return (
    <>
      {icon && <div className="p mb-2">{icon}</div>}
      <h4 className="text-scale-1200 mb-4 text-base">{title}</h4>
      <p className="p">{text}</p>
    </>
  )
}

export default FeatureColumn
