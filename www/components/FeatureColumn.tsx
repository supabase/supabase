function FeatureColumn({ icon, title, text }: any) {
  return (
    <>
      {icon && <div className="mb-2 p">{icon}</div>}
      <h4 className="mb-4 text-base text-scale-1200">{title}</h4>
      <p className="p">{text}</p>
    </>
  )
}

export default FeatureColumn
