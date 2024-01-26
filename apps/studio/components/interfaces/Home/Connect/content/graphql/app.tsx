import { ContentFileProps } from 'components/interfaces/Home/Connect/Connect.types'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'
import { getProjectRef } from '../../Connect.utils'

const ContentFile = ({ projectKeys }: ContentFileProps) => {
  const { apiUrl, anonKey } = projectKeys
  const projectRef = getProjectRef(apiUrl)

  return (
    <div>
      <SimpleCodeBlock className="bash">
        {`

const getCollection = async () => {
  try {
    const response = await fetch(process.env.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apiKey: process.env.API_KEY,
      },
      body: JSON.stringify({
        query: \`
    {
      collection(first: 1) {
        edges {
          node {
            id
          }
        }
      }
    }
  \`,
        variables: {},
      }),
    })

    if (!response.ok) {
      throw new Error('Network response was not ok')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.log(error)
  }
}

async function App() {
  const collection = await getCollection()

  return (
    <div className="App">
      {collection.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </div>
  )
}

export default App

  `}
      </SimpleCodeBlock>
    </div>
  )
}

export default ContentFile
