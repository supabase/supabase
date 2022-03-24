function FeatureColumn({ icon, title, text }: any) {
  return (
    <>
      {icon && <div className="mb-2">{icon}</div>}
      <h4 className="text-base mb-4">{title}</h4>
      <p className="p">{text}</p>
    </>
  )
}

export default FeatureColumn
