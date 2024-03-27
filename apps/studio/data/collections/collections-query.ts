import { useQuery } from '@tanstack/react-query'
import { collectionKeys } from './keys'

type CollectionsQueryArgs = {
  projectRef: string
}
export function useCollectionsQuery({ projectRef }: CollectionsQueryArgs) {
  const _keys = [...collectionKeys.list(projectRef)]
  if (!projectRef) {
    throw new Error('projectRef is required')
  }
  const collectionsQuery = useQuery(_keys, async () => {
    // mock collections
    const collections = [
      {
        id: 'ocBEKqMqRQzv',
        name: 'Collection 1',
        description: 'Collection 1 description',
      },
      {
        id: 'vSQHnuUGnqOR',
        name: 'Collection 2',
        description: 'Collection 2 description',
      },
      {
        id: 'cBLmuUejEyOB',
        name: 'Collection 3',
        description: 'Collection 3 description',
      },
    ]

    // mock delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return collections
  })

  return collectionsQuery
}

type CollectionQueryArgs = {
  projectRef: string
  collectionToken: string
}
export function useCollectionQuery({ projectRef, collectionToken }: CollectionQueryArgs) {
  const collectionQuery = useQuery(collectionKeys.item(projectRef, collectionToken), async () => {
    // mock collection
    const collection = {
      name: `Collection ${collectionToken}`,
      description: `Collection ${collectionToken} description`,
      data: [
        {
          id: 'issTIuFRIlLB',
          event_name: 'Brett Dean',
          payload: {
            foo: 'bar',
          },
          created_at: '27/08/2023 11:36:31',
        },
        {
          id: 'ERqauFtIGFTf',
          event_name: 'Janie Schneider',
          payload: {
            foo: 'bar',
          },
          created_at: '12/01/2023 19:21:09',
        },
        {
          id: 'iyrPPhIfnuDC',
          event_name: 'Estella Obrien',
          payload: {
            foo: 'bar',
          },
          created_at: '31/12/2023 06:23:59',
        },
        {
          id: 'ReJEvTVxMvuL',
          event_name: 'Clyde Curtis',
          created_at: '07/11/2023 11:43:13',
        },
        {
          id: 'IBBWBhQbrAWz',
          event_name: 'Eliza Goodman',
          created_at: '23/06/2023 21:59:34',
        },
        {
          id: 'ztXJtyUFLnFS',
          event_name: 'Amelia Ortega',
          created_at: '01/11/2023 21:09:06',
        },
        {
          id: 'yCjpguuufMCQ',
          event_name: 'Alice Adams',
          created_at: '15/08/2023 16:17:26',
        },
        {
          id: 'JNFtxSyjAzaA',
          event_name: 'Frank Paul',
          created_at: '21/12/2023 05:21:45',
        },
        {
          id: 'QOSYkRIyRWiu',
          event_name: 'Albert Morris',
          created_at: '28/03/2023 20:08:02',
        },
        {
          id: 'dKfSGfIQaldG',
          event_name: 'Brian Park',
          created_at: '29/03/2023 20:21:19',
        },
        {
          id: 'jGEQczffbTVR',
          event_name: 'Lida Palmer',
          created_at: '15/05/2023 11:05:23',
        },
        {
          id: 'xxdcZPtMiqGQ',
          event_name: 'Violet Powers',
          created_at: '27/04/2023 13:14:53',
        },
        {
          id: 'OfgRBGEtTstP',
          event_name: 'Roger Fernandez',
          created_at: '23/02/2023 11:01:26',
        },
        {
          id: 'rzNwliVDZdpd',
          event_name: 'Flora Garner',
          created_at: '07/08/2023 21:34:02',
        },
        {
          id: 'KRNnTqWovVtq',
          event_name: 'Alexander Lucas',
          created_at: '28/05/2023 12:23:34',
        },
        {
          id: 'pWMXEoXbYYUs',
          event_name: 'Jared Byrd',
          created_at: '07/08/2023 14:04:59',
        },
        {
          id: 'lnhBNuJZCpZU',
          event_name: 'Norman Young',
          created_at: '21/06/2023 09:29:27',
        },
        {
          id: 'dkGKILjrjvRq',
          event_name: 'Shawn Sanchez',
          created_at: '02/01/2023 17:31:59',
        },
        {
          id: 'eweTJIOCIthi',
          event_name: 'Allie Bell',
          created_at: '19/06/2023 14:48:34',
        },
        {
          id: 'GGVliCWdpTuL',
          event_name: 'Terry Dean',
          created_at: '03/07/2023 02:08:24',
        },
        {
          id: 'eKacKWmDJcBz',
          event_name: 'Norman Weber',
          created_at: '13/02/2023 03:51:57',
        },
        {
          id: 'tVbYzIdZFFdL',
          event_name: 'Gabriel McCoy',
          created_at: '27/12/2023 09:23:34',
        },
        {
          id: 'WkIOkRdfOgxJ',
          event_name: 'Carl Jones',
          created_at: '06/08/2023 08:18:51',
        },
        {
          id: 'aseWWBkVPugb',
          event_name: 'Harold Wood',
          created_at: '02/02/2023 21:00:49',
        },
        {
          id: 'bSBJodBDQhLO',
          event_name: 'Margaret Adkins',
          created_at: '10/11/2023 02:24:43',
        },
        {
          id: 'KCEFTEFwtqnj',
          event_name: 'Ethan Black',
          created_at: '06/05/2023 11:42:08',
        },
        {
          id: 'sBSQRMlscIyk',
          event_name: 'Louis McCarthy',
          created_at: '03/01/2023 14:04:00',
        },
        {
          id: 'RTFzODAzalCf',
          event_name: 'Alexander Jimenez',
          created_at: '08/10/2023 07:31:52',
        },
        {
          id: 'qwqKgnrsOyDe',
          event_name: 'Antonio Hunter',
          created_at: '28/05/2023 19:13:00',
        },
        {
          id: 'pznOWJstbxar',
          event_name: 'Sam Erickson',
          created_at: '13/02/2023 19:07:28',
        },
        {
          id: 'GQmNKmEWrfHO',
          event_name: 'Millie Collins',
          created_at: '27/07/2023 03:54:37',
        },
        {
          id: 'zzfRULsrskYm',
          event_name: 'Noah Sims',
          created_at: '04/02/2023 05:38:15',
        },
        {
          id: 'nBDEgIMSbvhV',
          event_name: 'Willie Ortega',
          created_at: '20/03/2023 04:35:24',
        },
        {
          id: 'iKcRTuhSLnZi',
          event_name: 'Ricardo Hart',
          created_at: '21/05/2023 08:00:33',
        },
        {
          id: 'rdNcQXVHblpl',
          event_name: 'Cecilia Cooper',
          created_at: '21/10/2023 01:24:17',
        },
        {
          id: 'iLutUSBfXWPN',
          event_name: 'Laura Thompson',
          created_at: '23/07/2023 17:29:28',
        },
        {
          id: 'uEHJdtWqWIhZ',
          event_name: 'Chad George',
          created_at: '31/12/2023 16:16:05',
        },
        {
          id: 'HgtLiZEhTmoh',
          event_name: 'Leroy Watson',
          created_at: '02/02/2023 14:40:19',
        },
        {
          id: 'VDvXcWKjwCpa',
          event_name: 'Marvin Porter',
          created_at: '29/07/2023 19:34:38',
        },
        {
          id: 'txLquBUXvnBb',
          event_name: 'Devin Love',
          created_at: '20/12/2023 06:55:11',
        },
        {
          id: 'OeKSpNIpuUPM',
          event_name: 'Leona Ford',
          created_at: '27/06/2023 03:59:29',
        },
        {
          id: 'oosiQMsHmtip',
          event_name: 'Carrie Caldwell',
          created_at: '05/09/2023 17:18:02',
        },
        {
          id: 'nJcxpHQvAUic',
          event_name: 'Leila Carpenter',
          created_at: '19/03/2023 07:53:00',
        },
        {
          id: 'EVmepTlbutRD',
          event_name: 'Blanche Malone',
          created_at: '18/08/2023 07:45:16',
        },
        {
          id: 'CXLEaxKgbAqs',
          event_name: 'Leo Lawson',
          created_at: '21/11/2023 15:37:08',
        },
        {
          id: 'QhzpCSHDfwLV',
          event_name: 'Jennie McLaughlin',
          created_at: '12/07/2023 18:57:56',
        },
        {
          id: 'PllEnOfffGgy',
          event_name: 'Gilbert Hanson',
          created_at: '15/07/2023 21:57:14',
        },
        {
          id: 'QevnTBuGaWOH',
          event_name: 'Alex Dennis',
          created_at: '21/10/2023 02:14:54',
        },
        {
          id: 'cKofAqPdiXWB',
          event_name: 'Christian Dixon',
          created_at: '24/07/2023 03:34:19',
        },
        {
          id: 'JiuXQjEJDTbk',
          event_name: 'Anne Alvarado',
          created_at: '27/03/2023 16:02:47',
        },
        {
          id: 'oSTTfkvFdBpM',
          event_name: 'Andre Montgomery',
          created_at: '19/05/2023 10:29:36',
        },
        {
          id: 'gLeLbudMUrNW',
          event_name: 'Olivia Estrada',
          created_at: '15/05/2023 04:45:48',
        },
        {
          id: 'qbDnKPUExFFB',
          event_name: 'Claudia Vasquez',
          created_at: '15/02/2023 10:48:30',
        },
        {
          id: 'xohbrpsmeLFW',
          event_name: 'Virgie Owens',
          created_at: '13/04/2023 10:59:23',
        },
        {
          id: 'UqYEgcODWDDL',
          event_name: 'Austin Snyder',
          created_at: '25/02/2023 22:53:24',
        },
        {
          id: 'brHBZDQGRHoH',
          event_name: 'Mina Wilkerson',
          created_at: '07/06/2023 15:04:25',
        },
        {
          id: 'wKLWhEPSibgK',
          event_name: 'Michael Ball',
          created_at: '21/01/2023 02:34:58',
        },
        {
          id: 'PjJyMfUwSiim',
          event_name: 'Douglas Ryan',
          created_at: '09/08/2023 11:52:28',
        },
        {
          id: 'VPwjrTZaWSTv',
          event_name: 'Ernest Ingram',
          created_at: '31/12/2023 15:55:19',
        },
        {
          id: 'gtrJCkjCdoUg',
          event_name: 'Douglas Rodriquez',
          created_at: '06/07/2023 20:25:10',
        },
        {
          id: 'WjZLJXswrReO',
          event_name: 'Virginia Elliott',
          created_at: '04/08/2023 18:21:03',
        },
        {
          id: 'hqygnZJqwXgM',
          event_name: 'Carolyn Lambert',
          created_at: '17/04/2023 13:33:58',
        },
        {
          id: 'BAmFdTIOzdDt',
          event_name: 'Caleb Young',
          created_at: '22/05/2023 07:48:57',
        },
        {
          id: 'vrbqJVPgPetA',
          event_name: 'Bruce Thomas',
          created_at: '23/06/2023 19:45:33',
        },
        {
          id: 'XKInblsSNSYE',
          event_name: 'William Rodriguez',
          created_at: '16/04/2023 01:02:57',
        },
        {
          id: 'qKEOIGCNIFjs',
          event_name: 'Aaron Dunn',
          created_at: '03/01/2023 04:52:18',
        },
        {
          id: 'slWCtTUiqrFO',
          event_name: 'Ina Estrada',
          created_at: '02/10/2023 00:13:52',
        },
        {
          id: 'atbBBKHzbgIo',
          event_name: 'Amanda Glover',
          created_at: '27/03/2023 22:30:16',
        },
        {
          id: 'JcMQkcQFLNmV',
          event_name: 'Nathaniel Carr',
          created_at: '27/04/2023 15:32:05',
        },
        {
          id: 'QjBJNayvLzwW',
          event_name: 'Rebecca Paul',
          created_at: '05/05/2023 20:13:08',
        },
        {
          id: 'zjMjfgShnpHg',
          event_name: 'Rodney Kim',
          created_at: '25/04/2023 19:15:47',
        },
      ],
    }

    // mock delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return collection
  })

  return collectionQuery
}
