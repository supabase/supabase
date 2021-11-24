require('dotenv').config()
var axios = require('axios')
var fs = require('fs')

const query = `
query Sponsors {
  organization(login: "supabase") {
    id
    sponsors(first: 100) {
      nodes {
        ... on Organization {
          id
          createdAt
          name : login
        }
        ... on User {
          id
          createdAt
          login
        }
      }
      totalCount
    }
  }
}
`

const fetchAllSponsors = async () => {
  const { data } = await axios.post(
    `https://api.github.com/graphql`,
    {
      query,
      variables: {
        username: 'supabase',
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${process.env.GITHUB_SPONSORS_TOKEN}`,
      },
    }
  )
  return data.data.organization.sponsors
}

const formatResults = (graphqlResponse) => {
  console.log('graph', graphqlResponse)
  return graphqlResponse.nodes
    .filter((x) => !!x.sponsor)
    .map((x) => ({
      tier: x.tier.name,
      sponsor: x.sponsor.login,
    }))
}

const writeFile = (data) => {
  fs.writeFile(
    './src/data/sponsors.json',
    JSON.stringify(data, null, 2),
    'utf8',
    function (err) {
      if (err) throw err
      console.log('sponsors.json saved.')
    }
  )
}

const main = async () => {
  const sponsorsResponse = await fetchAllSponsors()
  // console.log('sponsorsResponse.totalCount', sponsorsResponse.totalCount)
  const formatted = formatResults(sponsorsResponse)
  writeFile(formatted)
}
main()
