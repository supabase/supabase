import { NextPage } from "next"

export const getServerSideProps = (context: any) => {
  const params = context.params
  return { props: { id: params!.id } }
}

const Job: NextPage = ({ id }: any) => {
  return (
    <div>{id}</div>
  )
}

export default Job
