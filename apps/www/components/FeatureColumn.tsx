function FeatureColumn({ icon, title, text }: any) {
  return (
    <>
      {icon && <div className="mb-2 p">{icon}</div>}
      <h4 className="text-base text-scale-1200 mb-4">{title}</h4>
      <p className="p">{text}</p>
    </>
  )
}

export default FeatureColumn
