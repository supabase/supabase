import { useState } from 'react'
import { Database } from '~/lib/database.types'
import { timezones } from '~/data/timezones'

type Meetup = Database['public']['Tables']['meetups']['Row']
type MeetupInsert = Database['public']['Tables']['meetups']['Insert']

interface MeetupFormProps {
  initialData?: Partial<Meetup>
  onSubmit: (data: Partial<MeetupInsert>) => Promise<void>
  submitLabel: string
}

// List of countries in alphabetical order
const countries = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo',
  'Costa Rica',
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czech Republic',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Grenada',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Micronesia',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'North Korea',
  'North Macedonia',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Palestine',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Puerto Rico',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Sao Tome and Principe',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'S. Africa',
  'S. Korea',
  'S. Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Timor-Leste',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'UAE',
  'UK',
  'USA',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Vatican City',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe',
]

export default function MeetupForm({ initialData = {}, onSubmit, submitLabel }: MeetupFormProps) {
  const [formData, setFormData] = useState<Partial<MeetupInsert>>({
    title: initialData.title || '',
    country: initialData.country || '',
    city: initialData.city || '',
    start_at: initialData.start_at || '',
    display_info: initialData.display_info || '',
    timezone: initialData.timezone || '',
    is_live: initialData.is_live || false,
    is_published: initialData.is_published || true,
    link: initialData.link || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block mb-1 text-sm text-foreground">Title</label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full border border-border rounded-md bg-surface-100 p-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-400"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-foreground">City</label>
          <input
            type="text"
            value={formData.city || ''}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full border border-border rounded-md bg-surface-100 p-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-400"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block mb-1 text-sm text-foreground">Country</label>
          <select
            value={formData.country || ''}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            className="w-full border border-border rounded-md bg-surface-100 p-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-400"
            required
          >
            <option value="">Select a country</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm text-foreground">Timezone</label>
          <select
            value={formData.timezone || ''}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            className="w-full border border-border rounded-md bg-surface-100 p-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-400"
            required
          >
            <option value="">Select a timezone</option>
            {timezones.map((timezone) => (
              <option key={timezone} value={timezone}>
                {timezone}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block mb-1 text-sm text-foreground">Start Date</label>
          <input
            type="datetime-local"
            value={formData.start_at || ''}
            onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
            className="w-full border border-border rounded-md bg-surface-100 p-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-400"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-foreground">Link</label>
          <input
            type="url"
            value={formData.link || ''}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            className="w-full border border-border rounded-md bg-surface-100 p-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
      </div>

      <div>
        <label className="block mb-1 text-sm text-foreground">Display Info</label>
        <input
          type="text"
          value={formData.display_info || ''}
          onChange={(e) => setFormData({ ...formData, display_info: e.target.value })}
          className="w-full border border-border rounded-md bg-surface-100 p-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_live || false}
              onChange={(e) => setFormData({ ...formData, is_live: e.target.checked })}
              className="mr-2 h-4 w-4 rounded border-border text-brand-400 focus:ring-brand-400"
            />
            <label className="text-sm text-foreground">Is Live</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_published || false}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              className="mr-2 h-4 w-4 rounded border-border text-brand-400 focus:ring-brand-400"
            />
            <label className="text-sm text-foreground">Is Published</label>
          </div>
        </div>

        <button
          type="submit"
          className="px-3 py-1.5 shadow-sm border border-transparent text-sm text-white bg-brand-400 hover:bg-brand-300 focus:ring-2 focus:ring-offset-2 focus:ring-brand-300 rounded-md font-medium"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
