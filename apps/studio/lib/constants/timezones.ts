import dayjs from 'dayjs'

// [Joshen] Retrieved from the following repo, although some of its values are stale
// so we've made some amendments here
// https://github.com/dmfilipenko/timezones.json/blob/master/timezones.json
export interface Timezone {
  value: string
  isdst: boolean
  text: string
  utc: string[]
}

const ALL_TIMEZONES: Timezone[] = [
  {
    value: 'Dateline Standard Time',
    isdst: false,
    text: '(UTC-12:00) International Date Line West',
    utc: ['Etc/GMT+12'],
  },
  {
    value: 'UTC-11',
    isdst: false,
    text: '(UTC-11:00) Coordinated Universal Time-11',
    utc: ['Etc/GMT+11', 'Pacific/Midway', 'Pacific/Niue', 'Pacific/Pago_Pago'],
  },
  {
    value: 'Hawaiian Standard Time',
    isdst: false,
    text: '(UTC-10:00) Hawaii',
    utc: [
      'Etc/GMT+10',
      'Pacific/Honolulu',
      'Pacific/Johnston',
      'Pacific/Rarotonga',
      'Pacific/Tahiti',
    ],
  },
  {
    value: 'Alaskan Standard Time',
    isdst: true,
    text: '(UTC-09:00) Alaska',
    utc: [
      'America/Anchorage',
      'America/Juneau',
      'America/Nome',
      'America/Sitka',
      'America/Yakutat',
    ],
  },
  {
    value: 'Pacific Standard Time (Mexico)',
    isdst: true,
    text: '(UTC-08:00) Baja California',
    utc: ['America/Santa_Isabel'],
  },
  {
    value: 'Pacific Daylight Time',
    isdst: true,
    text: '(UTC-07:00) Pacific Daylight Time (US & Canada)',
    utc: ['America/Los_Angeles', 'America/Tijuana', 'America/Vancouver'],
  },
  {
    value: 'Pacific Standard Time',
    isdst: false,
    text: '(UTC-08:00) Pacific Time (US & Canada)',
    utc: ['America/Los_Angeles', 'America/Tijuana', 'America/Vancouver', 'PST8PDT'],
  },
  {
    value: 'US Mountain Standard Time',
    isdst: false,
    text: '(UTC-07:00) Arizona',
    utc: [
      'America/Creston',
      'America/Dawson',
      'America/Dawson_Creek',
      'America/Hermosillo',
      'America/Phoenix',
      'America/Whitehorse',
      'Etc/GMT+7',
    ],
  },
  {
    value: 'Mountain Standard Time (Mexico)',
    isdst: false,
    text: '(UTC-07:00) La Paz, Mazatlan',
    utc: ['America/Mazatlan'],
  },
  {
    value: 'Mountain Standard Time',
    isdst: true,
    text: '(UTC-07:00) Mountain Time (US & Canada)',
    utc: [
      'America/Boise',
      'America/Cambridge_Bay',
      'America/Denver',
      'America/Edmonton',
      'America/Inuvik',
      'America/Yellowknife',
      'MST7MDT',
    ],
  },
  {
    value: 'Central America Standard Time',
    isdst: false,
    text: '(UTC-06:00) Central America',
    utc: [
      'America/Belize',
      'America/Costa_Rica',
      'America/El_Salvador',
      'America/Guatemala',
      'America/Managua',
      'America/Tegucigalpa',
      'Etc/GMT+6',
      'Pacific/Galapagos',
    ],
  },
  {
    value: 'Central Standard Time',
    isdst: true,
    text: '(UTC-06:00) Central Time (US & Canada)',
    utc: [
      'America/Chicago',
      'America/Indiana/Knox',
      'America/Indiana/Tell_City',
      'America/Matamoros',
      'America/Menominee',
      'America/North_Dakota/Beulah',
      'America/North_Dakota/Center',
      'America/North_Dakota/New_Salem',
      'America/Rainy_River',
      'America/Rankin_Inlet',
      'America/Resolute',
      'America/Winnipeg',
      'CST6CDT',
    ],
  },
  {
    value: 'Central Standard Time (Mexico)',
    isdst: false,
    text: '(UTC-06:00) Guadalajara, Mexico City, Monterrey',
    utc: [
      'America/Bahia_Banderas',
      'America/Chihuahua',
      'America/Merida',
      'America/Mexico_City',
      'America/Monterrey',
      'America/Ojinaga',
    ],
  },
  {
    value: 'Canada Central Standard Time',
    isdst: false,
    text: '(UTC-06:00) Saskatchewan',
    utc: ['America/Regina', 'America/Swift_Current'],
  },
  {
    value: 'SA Pacific Standard Time',
    isdst: false,
    text: '(UTC-05:00) Bogota, Lima, Quito',
    utc: [
      'America/Bogota',
      'America/Cancun',
      'America/Cayman',
      'America/Coral_Harbour',
      'America/Eirunepe',
      'America/Guayaquil',
      'America/Jamaica',
      'America/Lima',
      'America/Panama',
      'America/Rio_Branco',
      'Etc/GMT+5',
    ],
  },
  {
    value: 'Eastern Standard Time',
    isdst: false,
    text: '(UTC-05:00) Eastern Time (US & Canada)',
    utc: [
      'America/Detroit',
      'America/Havana',
      'America/Indiana/Petersburg',
      'America/Indiana/Vincennes',
      'America/Indiana/Winamac',
      'America/Iqaluit',
      'America/Kentucky/Monticello',
      'America/Louisville',
      'America/Montreal',
      'America/Nassau',
      'America/New_York',
      'America/Nipigon',
      'America/Pangnirtung',
      'America/Port-au-Prince',
      'America/Thunder_Bay',
      'America/Toronto',
    ],
  },
  {
    value: 'Eastern Daylight Time',
    isdst: true,
    text: '(UTC-04:00) Eastern Daylight Time (US & Canada)',
    utc: [
      'America/Detroit',
      'America/Havana',
      'America/Indiana/Petersburg',
      'America/Indiana/Vincennes',
      'America/Indiana/Winamac',
      'America/Iqaluit',
      'America/Kentucky/Monticello',
      'America/Louisville',
      'America/Montreal',
      'America/Nassau',
      'America/New_York',
      'America/Nipigon',
      'America/Pangnirtung',
      'America/Port-au-Prince',
      'America/Thunder_Bay',
      'America/Toronto',
    ],
  },
  {
    value: 'US Eastern Standard Time',
    isdst: false,
    text: '(UTC-05:00) Indiana (East)',
    utc: ['America/Indiana/Marengo', 'America/Indiana/Vevay', 'America/Indianapolis'],
  },
  {
    value: 'Venezuela Standard Time',
    isdst: false,
    text: '(UTC-04:00) Caracas',
    utc: ['America/Caracas'],
  },
  {
    value: 'Paraguay Standard Time',
    isdst: false,
    text: '(UTC-03:00) Asuncion',
    utc: ['America/Asuncion'],
  },
  {
    value: 'Atlantic Standard Time',
    isdst: true,
    text: '(UTC-04:00) Atlantic Time (Canada)',
    utc: [
      'America/Glace_Bay',
      'America/Goose_Bay',
      'America/Halifax',
      'America/Moncton',
      'America/Thule',
      'Atlantic/Bermuda',
    ],
  },
  {
    value: 'Central Brazilian Standard Time',
    isdst: false,
    text: '(UTC-04:00) Cuiaba',
    utc: ['America/Campo_Grande', 'America/Cuiaba'],
  },
  {
    value: 'SA Western Standard Time',
    isdst: false,
    text: '(UTC-04:00) Georgetown, La Paz, Manaus, San Juan',
    utc: [
      'America/Anguilla',
      'America/Antigua',
      'America/Aruba',
      'America/Barbados',
      'America/Blanc-Sablon',
      'America/Boa_Vista',
      'America/Curacao',
      'America/Dominica',
      'America/Grand_Turk',
      'America/Grenada',
      'America/Guadeloupe',
      'America/Guyana',
      'America/Kralendijk',
      'America/La_Paz',
      'America/Lower_Princes',
      'America/Manaus',
      'America/Marigot',
      'America/Martinique',
      'America/Montserrat',
      'America/Port_of_Spain',
      'America/Porto_Velho',
      'America/Puerto_Rico',
      'America/Santo_Domingo',
      'America/St_Barthelemy',
      'America/St_Kitts',
      'America/St_Lucia',
      'America/St_Thomas',
      'America/St_Vincent',
      'America/Tortola',
      'Etc/GMT+4',
    ],
  },
  {
    value: 'Pacific SA Standard Time',
    isdst: false,
    text: '(UTC-04:00) Santiago',
    utc: ['America/Santiago'],
  },
  {
    value: 'Newfoundland Standard Time',
    isdst: true,
    text: '(UTC-03:30) Newfoundland',
    utc: ['America/St_Johns'],
  },
  {
    value: 'E. South America Standard Time',
    isdst: false,
    text: '(UTC-03:00) Brasilia',
    utc: ['America/Sao_Paulo'],
  },
  {
    value: 'Argentina Standard Time',
    isdst: false,
    text: '(UTC-03:00) Buenos Aires',
    utc: [
      'America/Argentina/La_Rioja',
      'America/Argentina/Rio_Gallegos',
      'America/Argentina/Salta',
      'America/Argentina/San_Juan',
      'America/Argentina/San_Luis',
      'America/Argentina/Tucuman',
      'America/Argentina/Ushuaia',
      'America/Buenos_Aires',
      'America/Catamarca',
      'America/Cordoba',
      'America/Jujuy',
      'America/Mendoza',
    ],
  },
  {
    value: 'SA Eastern Standard Time',
    isdst: false,
    text: '(UTC-03:00) Cayenne, Fortaleza',
    utc: [
      'America/Araguaina',
      'America/Belem',
      'America/Cayenne',
      'America/Fortaleza',
      'America/Maceio',
      'America/Paramaribo',
      'America/Recife',
      'America/Santarem',
      'Antarctica/Rothera',
      'Atlantic/Stanley',
      'Etc/GMT+3',
    ],
  },
  {
    value: 'Greenland Standard Time',
    isdst: true,
    text: '(UTC-02:00) Greenland',
    utc: ['America/Nuuk', 'America/Godthab'],
  },
  {
    value: 'Montevideo Standard Time',
    isdst: false,
    text: '(UTC-03:00) Montevideo',
    utc: ['America/Montevideo'],
  },
  {
    value: 'Bahia Standard Time',
    isdst: false,
    text: '(UTC-03:00) Salvador',
    utc: ['America/Bahia'],
  },
  {
    value: 'UTC-02',
    isdst: false,
    text: '(UTC-02:00) Coordinated Universal Time-02',
    utc: ['America/Noronha', 'Atlantic/South_Georgia', 'Etc/GMT+2'],
  },
  {
    value: 'Azores Standard Time',
    isdst: true,
    text: '(UTC-01:00) Azores',
    utc: ['America/Scoresbysund', 'Atlantic/Azores'],
  },
  {
    value: 'Cape Verde Standard Time',
    isdst: false,
    text: '(UTC-01:00) Cape Verde Is.',
    utc: ['Atlantic/Cape_Verde', 'Etc/GMT+1'],
  },
  {
    value: 'Morocco Standard Time',
    isdst: false,
    text: '(UTC+01:00) Casablanca',
    utc: ['Africa/Casablanca', 'Africa/El_Aaiun'],
  },
  {
    value: 'UTC',
    isdst: false,
    text: '(UTC+00:00) Coordinated Universal Time',
    utc: ['America/Danmarkshavn', 'Etc/GMT'],
  },
  {
    value: 'British Summer Time',
    isdst: true,
    text: '(UTC+01:00) Edinburgh, London',
    utc: ['Europe/Isle_of_Man', 'Europe/Guernsey', 'Europe/Jersey', 'Europe/London'],
  },
  {
    value: 'GMT Standard Time',
    isdst: true,
    text: '(UTC+00:00) Dublin, Lisbon',
    utc: [
      'Atlantic/Canary',
      'Atlantic/Faeroe',
      'Atlantic/Madeira',
      'Europe/Dublin',
      'Europe/Lisbon',
    ],
  },
  {
    value: 'Greenwich Standard Time',
    isdst: false,
    text: '(UTC+00:00) Monrovia, Reykjavik',
    utc: [
      'Africa/Abidjan',
      'Africa/Accra',
      'Africa/Bamako',
      'Africa/Banjul',
      'Africa/Bissau',
      'Africa/Conakry',
      'Africa/Dakar',
      'Africa/Freetown',
      'Africa/Lome',
      'Africa/Monrovia',
      'Africa/Nouakchott',
      'Africa/Ouagadougou',
      'Africa/Sao_Tome',
      'Atlantic/Reykjavik',
      'Atlantic/St_Helena',
    ],
  },
  {
    value: 'W. Europe Standard Time',
    isdst: true,
    text: '(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna',
    utc: [
      'Arctic/Longyearbyen',
      'Europe/Amsterdam',
      'Europe/Andorra',
      'Europe/Berlin',
      'Europe/Busingen',
      'Europe/Gibraltar',
      'Europe/Luxembourg',
      'Europe/Malta',
      'Europe/Monaco',
      'Europe/Oslo',
      'Europe/Rome',
      'Europe/San_Marino',
      'Europe/Stockholm',
      'Europe/Vaduz',
      'Europe/Vatican',
      'Europe/Vienna',
      'Europe/Zurich',
    ],
  },
  {
    value: 'Central Europe Standard Time',
    isdst: true,
    text: '(UTC+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague',
    utc: [
      'Europe/Belgrade',
      'Europe/Bratislava',
      'Europe/Budapest',
      'Europe/Ljubljana',
      'Europe/Podgorica',
      'Europe/Prague',
      'Europe/Tirane',
    ],
  },
  {
    value: 'Romance Standard Time',
    isdst: true,
    text: '(UTC+01:00) Brussels, Copenhagen, Madrid, Paris',
    utc: ['Africa/Ceuta', 'Europe/Brussels', 'Europe/Copenhagen', 'Europe/Madrid', 'Europe/Paris'],
  },
  {
    value: 'Central European Standard Time',
    isdst: true,
    text: '(UTC+01:00) Sarajevo, Skopje, Warsaw, Zagreb',
    utc: ['Europe/Sarajevo', 'Europe/Skopje', 'Europe/Warsaw', 'Europe/Zagreb'],
  },
  {
    value: 'W. Central Africa Standard Time',
    isdst: false,
    text: '(UTC+01:00) West Central Africa',
    utc: [
      'Africa/Algiers',
      'Africa/Bangui',
      'Africa/Brazzaville',
      'Africa/Douala',
      'Africa/Kinshasa',
      'Africa/Lagos',
      'Africa/Libreville',
      'Africa/Luanda',
      'Africa/Malabo',
      'Africa/Ndjamena',
      'Africa/Niamey',
      'Africa/Porto-Novo',
      'Africa/Tunis',
      'Etc/GMT-1',
    ],
  },
  {
    value: 'Namibia Standard Time',
    isdst: false,
    text: '(UTC+02:00) Windhoek',
    utc: ['Africa/Windhoek'],
  },
  {
    value: 'GTB Standard Time',
    isdst: true,
    text: '(UTC+02:00) Athens, Bucharest',
    utc: ['Asia/Nicosia', 'Europe/Athens', 'Europe/Bucharest', 'Europe/Chisinau'],
  },
  {
    value: 'Middle East Standard Time',
    isdst: true,
    text: '(UTC+02:00) Beirut',
    utc: ['Asia/Beirut'],
  },
  {
    value: 'Egypt Standard Time',
    isdst: false,
    text: '(UTC+02:00) Cairo',
    utc: ['Africa/Cairo'],
  },
  {
    value: 'Syria Standard Time',
    isdst: false,
    text: '(UTC+03:00) Damascus',
    utc: ['Asia/Damascus'],
  },
  {
    value: 'E. Europe Standard Time',
    isdst: true,
    text: '(UTC+02:00) E. Europe',
    utc: [
      'Asia/Nicosia',
      'Europe/Athens',
      'Europe/Bucharest',
      'Europe/Chisinau',
      'Europe/Helsinki',
      'Europe/Kiev',
      'Europe/Mariehamn',
      'Europe/Nicosia',
      'Europe/Riga',
      'Europe/Sofia',
      'Europe/Tallinn',
      'Europe/Uzhgorod',
      'Europe/Vilnius',
      'Europe/Zaporozhye',
    ],
  },
  {
    value: 'South Africa Standard Time',
    isdst: false,
    text: '(UTC+02:00) Harare, Pretoria',
    utc: [
      'Africa/Blantyre',
      'Africa/Bujumbura',
      'Africa/Gaborone',
      'Africa/Harare',
      'Africa/Johannesburg',
      'Africa/Juba',
      'Africa/Khartoum',
      'Africa/Kigali',
      'Africa/Lubumbashi',
      'Africa/Lusaka',
      'Africa/Maputo',
      'Africa/Maseru',
      'Africa/Mbabane',
      'Etc/GMT-2',
    ],
  },
  {
    value: 'FLE Standard Time',
    isdst: true,
    text: '(UTC+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius',
    utc: [
      'Europe/Helsinki',
      'Europe/Kiev',
      'Europe/Mariehamn',
      'Europe/Riga',
      'Europe/Sofia',
      'Europe/Tallinn',
      'Europe/Uzhgorod',
      'Europe/Vilnius',
      'Europe/Zaporozhye',
    ],
  },
  {
    value: 'Turkey Standard Time',
    isdst: false,
    text: '(UTC+03:00) Istanbul',
    utc: ['Europe/Istanbul'],
  },
  {
    value: 'Israel Standard Time',
    isdst: true,
    text: '(UTC+02:00) Jerusalem',
    utc: ['Asia/Jerusalem'],
  },
  {
    value: 'Libya Standard Time',
    isdst: false,
    text: '(UTC+02:00) Tripoli',
    utc: ['Africa/Tripoli'],
  },
  {
    value: 'Jordan Standard Time',
    isdst: false,
    text: '(UTC+03:00) Amman',
    utc: ['Asia/Amman'],
  },
  {
    value: 'Arabic Standard Time',
    isdst: false,
    text: '(UTC+03:00) Baghdad',
    utc: ['Asia/Baghdad'],
  },
  {
    value: 'Kaliningrad Standard Time',
    isdst: false,
    text: '(UTC+02:00) Kaliningrad',
    utc: ['Europe/Kaliningrad'],
  },
  {
    value: 'Arab Standard Time',
    isdst: false,
    text: '(UTC+03:00) Kuwait, Riyadh',
    utc: ['Asia/Aden', 'Asia/Bahrain', 'Asia/Kuwait', 'Asia/Qatar', 'Asia/Riyadh'],
  },
  {
    value: 'E. Africa Standard Time',
    isdst: false,
    text: '(UTC+03:00) Nairobi',
    utc: [
      'Africa/Addis_Ababa',
      'Africa/Asmera',
      'Africa/Dar_es_Salaam',
      'Africa/Djibouti',
      'Africa/Kampala',
      'Africa/Mogadishu',
      'Africa/Nairobi',
      'Antarctica/Syowa',
      'Etc/GMT-3',
      'Indian/Antananarivo',
      'Indian/Comoro',
      'Indian/Mayotte',
    ],
  },
  {
    value: 'Moscow Standard Time',
    isdst: false,
    text: '(UTC+03:00) Moscow, St. Petersburg, Volgograd, Minsk',
    utc: ['Europe/Kirov', 'Europe/Moscow', 'Europe/Simferopol', 'Europe/Volgograd', 'Europe/Minsk'],
  },
  {
    value: 'Samara Time',
    isdst: false,
    text: '(UTC+04:00) Samara, Ulyanovsk, Saratov',
    utc: ['Europe/Astrakhan', 'Europe/Samara', 'Europe/Ulyanovsk'],
  },
  {
    value: 'Iran Standard Time',
    isdst: true,
    text: '(UTC+03:30) Tehran',
    utc: ['Asia/Tehran'],
  },
  {
    value: 'Arabian Standard Time',
    isdst: false,
    text: '(UTC+04:00) Abu Dhabi, Muscat',
    utc: ['Asia/Dubai', 'Asia/Muscat', 'Etc/GMT-4'],
  },
  {
    value: 'Azerbaijan Standard Time',
    isdst: true,
    text: '(UTC+04:00) Baku',
    utc: ['Asia/Baku'],
  },
  {
    value: 'Mauritius Standard Time',
    isdst: false,
    text: '(UTC+04:00) Port Louis',
    utc: ['Indian/Mahe', 'Indian/Mauritius', 'Indian/Reunion'],
  },
  {
    value: 'Georgian Standard Time',
    isdst: false,
    text: '(UTC+04:00) Tbilisi',
    utc: ['Asia/Tbilisi'],
  },
  {
    value: 'Caucasus Standard Time',
    isdst: false,
    text: '(UTC+04:00) Yerevan',
    utc: ['Asia/Yerevan'],
  },
  {
    value: 'Afghanistan Standard Time',
    isdst: false,
    text: '(UTC+04:30) Kabul',
    utc: ['Asia/Kabul'],
  },
  {
    value: 'West Asia Standard Time',
    isdst: false,
    text: '(UTC+05:00) Ashgabat, Tashkent',
    utc: [
      'Antarctica/Mawson',
      'Antarctica/Vostok',
      'Asia/Almaty',
      'Asia/Aqtau',
      'Asia/Aqtobe',
      'Asia/Ashgabat',
      'Asia/Dushanbe',
      'Asia/Oral',
      'Asia/Qyzylorda',
      'Asia/Samarkand',
      'Asia/Tashkent',
      'Etc/GMT-5',
      'Indian/Kerguelen',
      'Indian/Maldives',
    ],
  },
  {
    value: 'Yekaterinburg Time',
    isdst: false,
    text: '(UTC+05:00) Yekaterinburg',
    utc: ['Asia/Yekaterinburg'],
  },
  {
    value: 'Pakistan Standard Time',
    isdst: false,
    text: '(UTC+05:00) Islamabad, Karachi',
    utc: ['Asia/Karachi'],
  },
  {
    value: 'India Standard Time',
    isdst: false,
    text: '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi',
    utc: ['Asia/Kolkata', 'Asia/Calcutta'],
  },
  {
    value: 'Sri Lanka Standard Time',
    isdst: false,
    text: '(UTC+05:30) Sri Jayawardenepura',
    utc: ['Asia/Colombo'],
  },
  {
    value: 'Nepal Standard Time',
    isdst: false,
    text: '(UTC+05:45) Kathmandu',
    utc: ['Asia/Kathmandu'],
  },
  {
    value: 'Central Asia Standard Time',
    isdst: false,
    text: '(UTC+06:00) Bishkek, Urumqi',
    utc: ['Asia/Bishkek', 'Asia/Urumqi', 'Etc/GMT-6', 'Indian/Chagos'],
  },
  {
    value: 'Bangladesh Standard Time',
    isdst: false,
    text: '(UTC+06:00) Dhaka',
    utc: ['Asia/Dhaka', 'Asia/Omsk', 'Asia/Thimphu'],
  },
  {
    value: 'Myanmar Standard Time',
    isdst: false,
    text: '(UTC+06:30) Yangon (Rangoon)',
    utc: ['Asia/Rangoon', 'Indian/Cocos'],
  },
  {
    value: 'SE Asia Standard Time',
    isdst: false,
    text: '(UTC+07:00) Bangkok, Hanoi, Jakarta',
    utc: [
      'Antarctica/Davis',
      'Asia/Bangkok',
      'Asia/Hovd',
      'Asia/Jakarta',
      'Asia/Phnom_Penh',
      'Asia/Pontianak',
      'Asia/Saigon',
      'Asia/Vientiane',
      'Etc/GMT-7',
      'Indian/Christmas',
    ],
  },
  {
    value: 'N. Central Asia Standard Time',
    isdst: false,
    text: '(UTC+07:00) Novosibirsk',
    utc: ['Asia/Novokuznetsk', 'Asia/Novosibirsk'],
  },
  {
    value: 'China Standard Time',
    isdst: false,
    text: '(UTC+08:00) Beijing, Chongqing, Hong Kong, Urumqi',
    utc: ['Asia/Hong_Kong', 'Asia/Macau', 'Asia/Shanghai'],
  },
  {
    value: 'North Asia Standard Time',
    isdst: false,
    text: '(UTC+07:00) Krasnoyarsk',
    utc: ['Asia/Krasnoyarsk'],
  },
  {
    value: 'Singapore Standard Time',
    isdst: false,
    text: '(UTC+08:00) Kuala Lumpur, Singapore',
    utc: [
      'Asia/Brunei',
      'Asia/Kuala_Lumpur',
      'Asia/Kuching',
      'Asia/Makassar',
      'Asia/Manila',
      'Asia/Singapore',
      'Etc/GMT-8',
    ],
  },
  {
    value: 'W. Australia Standard Time',
    isdst: false,
    text: '(UTC+08:00) Perth',
    utc: ['Antarctica/Casey', 'Australia/Perth'],
  },
  {
    value: 'Taipei Standard Time',
    isdst: false,
    text: '(UTC+08:00) Taipei',
    utc: ['Asia/Taipei'],
  },
  {
    value: 'Ulaanbaatar Standard Time',
    isdst: false,
    text: '(UTC+08:00) Ulaanbaatar',
    utc: ['Asia/Choibalsan', 'Asia/Ulaanbaatar'],
  },
  {
    value: 'North Asia East Standard Time',
    isdst: false,
    text: '(UTC+08:00) Irkutsk',
    utc: ['Asia/Irkutsk'],
  },
  {
    value: 'Japan Standard Time',
    isdst: false,
    text: '(UTC+09:00) Osaka, Sapporo, Tokyo',
    utc: ['Asia/Dili', 'Asia/Jayapura', 'Asia/Tokyo', 'Etc/GMT-9', 'Pacific/Palau'],
  },
  {
    value: 'Korea Standard Time',
    isdst: false,
    text: '(UTC+09:00) Seoul',
    utc: ['Asia/Pyongyang', 'Asia/Seoul'],
  },
  {
    value: 'Cen. Australia Standard Time',
    isdst: false,
    text: '(UTC+09:30) Adelaide',
    utc: ['Australia/Adelaide', 'Australia/Broken_Hill'],
  },
  {
    value: 'AUS Central Standard Time',
    isdst: false,
    text: '(UTC+09:30) Darwin',
    utc: ['Australia/Darwin'],
  },
  {
    value: 'E. Australia Standard Time',
    isdst: false,
    text: '(UTC+10:00) Brisbane',
    utc: ['Australia/Brisbane', 'Australia/Lindeman'],
  },
  {
    value: 'AUS Eastern Standard Time',
    isdst: false,
    text: '(UTC+10:00) Canberra, Melbourne, Sydney',
    utc: ['Australia/Melbourne', 'Australia/Sydney'],
  },
  {
    value: 'West Pacific Standard Time',
    isdst: false,
    text: '(UTC+10:00) Guam, Port Moresby',
    utc: [
      'Antarctica/DumontDUrville',
      'Etc/GMT-10',
      'Pacific/Guam',
      'Pacific/Port_Moresby',
      'Pacific/Saipan',
      'Pacific/Truk',
    ],
  },
  {
    value: 'Tasmania Standard Time',
    isdst: false,
    text: '(UTC+10:00) Hobart',
    utc: ['Australia/Currie', 'Australia/Hobart'],
  },
  {
    value: 'Yakutsk Standard Time',
    isdst: false,
    text: '(UTC+09:00) Yakutsk',
    utc: ['Asia/Chita', 'Asia/Khandyga', 'Asia/Yakutsk'],
  },
  {
    value: 'Central Pacific Standard Time',
    isdst: false,
    text: '(UTC+11:00) Solomon Is., New Caledonia',
    utc: [
      'Antarctica/Macquarie',
      'Etc/GMT-11',
      'Pacific/Efate',
      'Pacific/Guadalcanal',
      'Pacific/Kosrae',
      'Pacific/Noumea',
      'Pacific/Ponape',
    ],
  },
  {
    value: 'Vladivostok Standard Time',
    isdst: false,
    text: '(UTC+10:00) Vladivostok',
    utc: ['Asia/Vladivostok', 'Asia/Ust-Nera'],
  },
  {
    value: 'New Zealand Standard Time',
    isdst: false,
    text: '(UTC+12:00) Auckland, Wellington',
    utc: ['Antarctica/McMurdo', 'Pacific/Auckland'],
  },
  {
    value: 'UTC+12',
    isdst: false,
    text: '(UTC+12:00) Coordinated Universal Time+12',
    utc: [
      'Etc/GMT-12',
      'Pacific/Funafuti',
      'Pacific/Kwajalein',
      'Pacific/Majuro',
      'Pacific/Nauru',
      'Pacific/Tarawa',
      'Pacific/Wake',
      'Pacific/Wallis',
    ],
  },
  {
    value: 'Fiji Standard Time',
    isdst: false,
    text: '(UTC+12:00) Fiji',
    utc: ['Pacific/Fiji'],
  },
  {
    value: 'Magadan Standard Time',
    isdst: false,
    text: '(UTC+11:00) Magadan, Sakhalin',
    utc: ['Asia/Magadan', 'Asia/Sakhalin', 'Asia/Srednekolymsk'],
  },
  {
    value: 'Kamchatka Standard Time',
    isdst: true,
    text: '(UTC+12:00) Petropavlovsk-Kamchatsky - Old',
    utc: ['Asia/Kamchatka', 'Asia/Anadyr'],
  },
  {
    value: 'Tonga Standard Time',
    isdst: false,
    text: "(UTC+13:00) Nuku'alofa",
    utc: ['Etc/GMT-13', 'Pacific/Enderbury', 'Pacific/Fakaofo', 'Pacific/Tongatapu'],
  },
  {
    value: 'Samoa Standard Time',
    isdst: false,
    text: '(UTC+13:00) Samoa',
    utc: ['Pacific/Apia'],
  },
]

/**
 * Deduplicated view of `ALL_TIMEZONES`, keyed by the entry's primary IANA
 * name (`utc[0]`). Several catalog rows share an IANA target — e.g. PDT and
 * PST both point to `America/Los_Angeles` — which would render duplicate UI
 * rows that all store the same value when picked. We prefer the standard-time
 * (`isdst: false`) row when both are present.
 */
export const TIMEZONES_BY_IANA: Timezone[] = (() => {
  const seen = new Map<string, Timezone>()
  for (const entry of ALL_TIMEZONES) {
    const key = entry.utc[0]
    if (!key) continue
    const existing = seen.get(key)
    if (!existing || (existing.isdst && !entry.isdst)) {
      seen.set(key, entry)
    }
  }
  return Array.from(seen.values())
})()

const TIMEZONES_BY_PRIMARY_IANA = new Map(TIMEZONES_BY_IANA.map((entry) => [entry.utc[0], entry]))

/**
 * Look up the catalog entry that owns the given IANA name (any of `utc[]`). Always returns the
 * entry from `TIMEZONES_BY_IANA`, so the result is something a picker built from that list can
 * show as selected, even if the IANA name was listed on a deduplicated-away row.
 */
export const findTimezoneByIana = (iana: string): Timezone | undefined => {
  const entry = ALL_TIMEZONES.find((timezone) => timezone.utc.includes(iana))
  return entry && (TIMEZONES_BY_PRIMARY_IANA.get(entry.utc[0]) ?? entry)
}

// Constructing an Intl.DateTimeFormat is expensive and pickers format ~100 rows on every render
const offsetFormatters = new Map<string, Intl.DateTimeFormat>()

const getOffsetFormatter = (timeZone: string) => {
  let formatter = offsetFormatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
    offsetFormatters.set(timeZone, formatter)
  }
  return formatter
}

/**
 * Catalog labels (`text`) carry a fixed offset prefix, e.g. `(UTC+01:00) Madrid`, which is wrong
 * for half the year in zones that observe DST. This swaps that prefix for the zone's offset at
 * `date` (defaults to now), derived from its primary IANA name (`utc[0]`).
 */
export const getTimezoneLabel = (timezone: Timezone, date?: dayjs.ConfigType) => {
  const offset =
    getOffsetFormatter(timezone.utc[0])
      .formatToParts(dayjs(date).toDate())
      .find((part) => part.type === 'timeZoneName')
      ?.value.replace('GMT', '') || '+00:00'
  return timezone.text.replace(/^\(UTC[^)]*\)/, `(UTC${offset})`)
}

/** Same as `getTimezoneLabel`, for a stored IANA name. Falls back to the IANA name if unknown. */
export const getTimezoneLabelByIana = (iana: string, date?: dayjs.ConfigType) => {
  const timezone = findTimezoneByIana(iana)
  return timezone ? getTimezoneLabel(timezone, date) : iana
}
