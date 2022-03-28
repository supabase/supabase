import { SupabaseClient } from '@supabase/supabase-js'
import { Button, Form, Input, InputNumber, Select } from '@supabase/ui'
import { FormEventHandler, useState } from 'react'
import { PartnerContact } from '~/types/partners'

const INITIAL_VALUES = {
  type: 'expert',
  first: '',
  last: '',
  company: '',
  size: '',
  title: '',
  email: '',
  phone: '',
  country: 'Singapore',
  details: '',
}

const validate = (values: any) => {
  const errors: any = {}

  if (!values.first) {
    errors.first = 'Required'
  }

  if (!values.last) {
    errors.last = 'Required'
  }

  if (!values.email) {
    errors.email = 'Required'
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
    errors.email = 'Invalid email address'
  }

  return errors
}

export default function BecomeAPartner({ supabase }: { supabase: SupabaseClient }) {
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false)

  const handleFormSubmit = async (values: any) => {
    const { error } = await supabase.from<PartnerContact>('partner_contacts').insert(
      [
        {
          type: values.type,
          first: values.first,
          last: values.last,
          company: values.company,
          size: Number(values.size),
          title: values.title,
          email: values.email,
          website: values.email.split('@')[1],
          phone: values.phone,
          country: values.country,
          details: values.details,
        },
      ],
      { returning: 'minimal' }
    )

    // TODO: handle error
    console.log('error:', error)

    setFormSubmitted(true)
  }

  return (
    <div className="border-t">
      <div id="become-a-partner" className="max-w-2xl mx-auto space-y-12 py-12">
        <h2 className="h2">Become a Partner</h2>

        <Form initialValues={INITIAL_VALUES} validate={validate} onSubmit={handleFormSubmit}>
          {({ isSubmitting }: any) => (
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <div className="h-24 col-span-2">
                <Select
                  id="type"
                  name="type"
                  className="font-sans"
                  label="What type of partner are you?"
                  layout="vertical"
                >
                  <Select.Option value="expert" selected={true}>
                    Expert (Agency &amp; Consulting)
                  </Select.Option>
                  <Select.Option value="technology">Technology</Select.Option>
                </Select>
              </div>

              <div className="h-24">
                <Input
                  label="First Name *"
                  id="first"
                  name="first"
                  layout="vertical"
                  placeholder="Jane"
                />
              </div>

              <div className="h-24">
                <Input
                  label="Last Name *"
                  id="last"
                  name="last"
                  layout="vertical"
                  placeholder="Doe"
                />
              </div>

              <div className="h-24">
                <Input
                  label="Company Name"
                  id="company"
                  name="company"
                  layout="vertical"
                  placeholder="Supa Inc."
                />
              </div>

              <div className="h-24">
                <InputNumber
                  label="Company Size"
                  id="size"
                  name="size"
                  layout="vertical"
                  placeholder="1"
                />
              </div>

              <div className="h-24">
                <Input
                  label="Job Title"
                  id="title"
                  name="title"
                  layout="vertical"
                  placeholder="CEO"
                />
              </div>

              <div className="h-24">
                <Input
                  label="Business email *"
                  id="email"
                  name="email"
                  layout="vertical"
                  placeholder="janedoe@example.sg"
                />
              </div>

              <div className="h-24">
                <Input
                  label="Phone Number"
                  id="phone"
                  name="phone"
                  layout="vertical"
                  placeholder="+65 1234 1234"
                />
              </div>

              <div className="h-24">
                <Select
                  label="Country / Main Timezone"
                  id="country"
                  name="country"
                  layout="vertical"
                >
                  <Select.Option value="Afghanistan">Afghanistan</Select.Option>
                  <Select.Option value="Albania">Albania</Select.Option>
                  <Select.Option value="Algeria">Algeria</Select.Option>
                  <Select.Option value="American Samoa">American Samoa</Select.Option>
                  <Select.Option value="Andorra">Andorra</Select.Option>
                  <Select.Option value="Angola">Angola</Select.Option>
                  <Select.Option value="Anguilla">Anguilla</Select.Option>
                  <Select.Option value="Antarctica">Antarctica</Select.Option>
                  <Select.Option value="Antigua and Barbuda">Antigua and Barbuda</Select.Option>
                  <Select.Option value="Argentina">Argentina</Select.Option>
                  <Select.Option value="Armenia">Armenia</Select.Option>
                  <Select.Option value="Aruba">Aruba</Select.Option>
                  <Select.Option value="Australia">Australia</Select.Option>
                  <Select.Option value="Austria">Austria</Select.Option>
                  <Select.Option value="Azerbaijan">Azerbaijan</Select.Option>
                  <Select.Option value="Bahamas">Bahamas</Select.Option>
                  <Select.Option value="Bahrain">Bahrain</Select.Option>
                  <Select.Option value="Bangladesh">Bangladesh</Select.Option>
                  <Select.Option value="Barbados">Barbados</Select.Option>
                  <Select.Option value="Belarus">Belarus</Select.Option>
                  <Select.Option value="Belgium">Belgium</Select.Option>
                  <Select.Option value="Belize">Belize</Select.Option>
                  <Select.Option value="Benin">Benin</Select.Option>
                  <Select.Option value="Bermuda">Bermuda</Select.Option>
                  <Select.Option value="Bhutan">Bhutan</Select.Option>
                  <Select.Option value="Bolivia">Bolivia</Select.Option>
                  <Select.Option value="Bosnia and Herzegovina">
                    Bosnia and Herzegovina
                  </Select.Option>
                  <Select.Option value="Botswana">Botswana</Select.Option>
                  <Select.Option value="Bouvet Island">Bouvet Island</Select.Option>
                  <Select.Option value="Brazil">Brazil</Select.Option>
                  <Select.Option value="British Indian Ocean Territory">
                    British Indian Ocean Territory
                  </Select.Option>
                  <Select.Option value="Brunei Darussalam">Brunei Darussalam</Select.Option>
                  <Select.Option value="Bulgaria">Bulgaria</Select.Option>
                  <Select.Option value="Burkina Faso">Burkina Faso</Select.Option>
                  <Select.Option value="Burundi">Burundi</Select.Option>
                  <Select.Option value="Cambodia">Cambodia</Select.Option>
                  <Select.Option value="Cameroon">Cameroon</Select.Option>
                  <Select.Option value="Canada">Canada</Select.Option>
                  <Select.Option value="Cape Verde">Cape Verde</Select.Option>
                  <Select.Option value="Cayman Islands">Cayman Islands</Select.Option>
                  <Select.Option value="Central African Republic">
                    Central African Republic
                  </Select.Option>
                  <Select.Option value="Chad">Chad</Select.Option>
                  <Select.Option value="Chile">Chile</Select.Option>
                  <Select.Option value="China">China</Select.Option>
                  <Select.Option value="Christmas Island">Christmas Island</Select.Option>
                  <Select.Option value="Cocos (Keeling) Islands">
                    Cocos (Keeling) Islands
                  </Select.Option>
                  <Select.Option value="Colombia">Colombia</Select.Option>
                  <Select.Option value="Comoros">Comoros</Select.Option>
                  <Select.Option value="Congo">Congo</Select.Option>
                  <Select.Option value="Congo, the Democratic Republic of the">
                    Congo, the Democratic Republic of the
                  </Select.Option>
                  <Select.Option value="Cook Islands">Cook Islands</Select.Option>
                  <Select.Option value="Costa Rica">Costa Rica</Select.Option>
                  <Select.Option value="Cote D'Ivoire">Cote D'Ivoire</Select.Option>
                  <Select.Option value="Croatia">Croatia</Select.Option>
                  <Select.Option value="Cuba">Cuba</Select.Option>
                  <Select.Option value="Cyprus">Cyprus</Select.Option>
                  <Select.Option value="Czech Republic">Czech Republic</Select.Option>
                  <Select.Option value="Denmark">Denmark</Select.Option>
                  <Select.Option value="Djibouti">Djibouti</Select.Option>
                  <Select.Option value="Dominica">Dominica</Select.Option>
                  <Select.Option value="Dominican Republic">Dominican Republic</Select.Option>
                  <Select.Option value="Ecuador">Ecuador</Select.Option>
                  <Select.Option value="Egypt">Egypt</Select.Option>
                  <Select.Option value="El Salvador">El Salvador</Select.Option>
                  <Select.Option value="Equatorial Guinea">Equatorial Guinea</Select.Option>
                  <Select.Option value="Eritrea">Eritrea</Select.Option>
                  <Select.Option value="Estonia">Estonia</Select.Option>
                  <Select.Option value="Ethiopia">Ethiopia</Select.Option>
                  <Select.Option value="Falkland Islands (Malvinas)">
                    Falkland Islands (Malvinas)
                  </Select.Option>
                  <Select.Option value="Faroe Islands">Faroe Islands</Select.Option>
                  <Select.Option value="Fiji">Fiji</Select.Option>
                  <Select.Option value="Finland">Finland</Select.Option>
                  <Select.Option value="France">France</Select.Option>
                  <Select.Option value="French Guiana">French Guiana</Select.Option>
                  <Select.Option value="French Polynesia">French Polynesia</Select.Option>
                  <Select.Option value="French Southern Territories">
                    French Southern Territories
                  </Select.Option>
                  <Select.Option value="Gabon">Gabon</Select.Option>
                  <Select.Option value="Gambia">Gambia</Select.Option>
                  <Select.Option value="Georgia">Georgia</Select.Option>
                  <Select.Option value="Germany">Germany</Select.Option>
                  <Select.Option value="Ghana">Ghana</Select.Option>
                  <Select.Option value="Gibraltar">Gibraltar</Select.Option>
                  <Select.Option value="Greece">Greece</Select.Option>
                  <Select.Option value="Greenland">Greenland</Select.Option>
                  <Select.Option value="Grenada">Grenada</Select.Option>
                  <Select.Option value="Guadeloupe">Guadeloupe</Select.Option>
                  <Select.Option value="Guam">Guam</Select.Option>
                  <Select.Option value="Guatemala">Guatemala</Select.Option>
                  <Select.Option value="Guinea">Guinea</Select.Option>
                  <Select.Option value="Guinea-Bissau">Guinea-Bissau</Select.Option>
                  <Select.Option value="Guyana">Guyana</Select.Option>
                  <Select.Option value="Haiti">Haiti</Select.Option>
                  <Select.Option value="Heard Island and Mcdonald Islands">
                    Heard Island and Mcdonald Islands
                  </Select.Option>
                  <Select.Option value="Holy See (Vatican City State)">
                    Holy See (Vatican City State)
                  </Select.Option>
                  <Select.Option value="Honduras">Honduras</Select.Option>
                  <Select.Option value="Hong Kong">Hong Kong</Select.Option>
                  <Select.Option value="Hungary">Hungary</Select.Option>
                  <Select.Option value="Iceland">Iceland</Select.Option>
                  <Select.Option value="India">India</Select.Option>
                  <Select.Option value="Indonesia">Indonesia</Select.Option>
                  <Select.Option value="Iran, Islamic Republic of">
                    Iran, Islamic Republic of
                  </Select.Option>
                  <Select.Option value="Iraq">Iraq</Select.Option>
                  <Select.Option value="Ireland">Ireland</Select.Option>
                  <Select.Option value="Israel">Israel</Select.Option>
                  <Select.Option value="Italy">Italy</Select.Option>
                  <Select.Option value="Jamaica">Jamaica</Select.Option>
                  <Select.Option value="Japan">Japan</Select.Option>
                  <Select.Option value="Jordan">Jordan</Select.Option>
                  <Select.Option value="Kazakhstan">Kazakhstan</Select.Option>
                  <Select.Option value="Kenya">Kenya</Select.Option>
                  <Select.Option value="Kiribati">Kiribati</Select.Option>
                  <Select.Option value="North Korea">North Korea</Select.Option>
                  <Select.Option value="South Korea">South Korea</Select.Option>
                  <Select.Option value="Kuwait">Kuwait</Select.Option>
                  <Select.Option value="Kyrgyzstan">Kyrgyzstan</Select.Option>
                  <Select.Option value="Lao People's Democratic Republic">
                    Lao People's Democratic Republic
                  </Select.Option>
                  <Select.Option value="Latvia">Latvia</Select.Option>
                  <Select.Option value="Lebanon">Lebanon</Select.Option>
                  <Select.Option value="Lesotho">Lesotho</Select.Option>
                  <Select.Option value="Liberia">Liberia</Select.Option>
                  <Select.Option value="Libya">Libya</Select.Option>
                  <Select.Option value="Liechtenstein">Liechtenstein</Select.Option>
                  <Select.Option value="Lithuania">Lithuania</Select.Option>
                  <Select.Option value="Luxembourg">Luxembourg</Select.Option>
                  <Select.Option value="Macao">Macao</Select.Option>
                  <Select.Option value="Madagascar">Madagascar</Select.Option>
                  <Select.Option value="Malawi">Malawi</Select.Option>
                  <Select.Option value="Malaysia">Malaysia</Select.Option>
                  <Select.Option value="Maldives">Maldives</Select.Option>
                  <Select.Option value="Mali">Mali</Select.Option>
                  <Select.Option value="Malta">Malta</Select.Option>
                  <Select.Option value="Marshall Islands">Marshall Islands</Select.Option>
                  <Select.Option value="Martinique">Martinique</Select.Option>
                  <Select.Option value="Mauritania">Mauritania</Select.Option>
                  <Select.Option value="Mauritius">Mauritius</Select.Option>
                  <Select.Option value="Mayotte">Mayotte</Select.Option>
                  <Select.Option value="Mexico">Mexico</Select.Option>
                  <Select.Option value="Micronesia, Federated States of">
                    Micronesia, Federated States of
                  </Select.Option>
                  <Select.Option value="Moldova, Republic of">Moldova, Republic of</Select.Option>
                  <Select.Option value="Monaco">Monaco</Select.Option>
                  <Select.Option value="Mongolia">Mongolia</Select.Option>
                  <Select.Option value="Montserrat">Montserrat</Select.Option>
                  <Select.Option value="Morocco">Morocco</Select.Option>
                  <Select.Option value="Mozambique">Mozambique</Select.Option>
                  <Select.Option value="Myanmar">Myanmar</Select.Option>
                  <Select.Option value="Namibia">Namibia</Select.Option>
                  <Select.Option value="Nauru">Nauru</Select.Option>
                  <Select.Option value="Nepal">Nepal</Select.Option>
                  <Select.Option value="Netherlands">Netherlands</Select.Option>
                  <Select.Option value="New Caledonia">New Caledonia</Select.Option>
                  <Select.Option value="New Zealand">New Zealand</Select.Option>
                  <Select.Option value="Nicaragua">Nicaragua</Select.Option>
                  <Select.Option value="Niger">Niger</Select.Option>
                  <Select.Option value="Nigeria">Nigeria</Select.Option>
                  <Select.Option value="Niue">Niue</Select.Option>
                  <Select.Option value="Norfolk Island">Norfolk Island</Select.Option>
                  <Select.Option value="North Macedonia, Republic of">
                    North Macedonia, Republic of
                  </Select.Option>
                  <Select.Option value="Northern Mariana Islands">
                    Northern Mariana Islands
                  </Select.Option>
                  <Select.Option value="Norway">Norway</Select.Option>
                  <Select.Option value="Oman">Oman</Select.Option>
                  <Select.Option value="Pakistan">Pakistan</Select.Option>
                  <Select.Option value="Palau">Palau</Select.Option>
                  <Select.Option value="State of Palestine">State of Palestine</Select.Option>
                  <Select.Option value="Panama">Panama</Select.Option>
                  <Select.Option value="Papua New Guinea">Papua New Guinea</Select.Option>
                  <Select.Option value="Paraguay">Paraguay</Select.Option>
                  <Select.Option value="Peru">Peru</Select.Option>
                  <Select.Option value="Philippines">Philippines</Select.Option>
                  <Select.Option value="Pitcairn">Pitcairn</Select.Option>
                  <Select.Option value="Poland">Poland</Select.Option>
                  <Select.Option value="Portugal">Portugal</Select.Option>
                  <Select.Option value="Puerto Rico">Puerto Rico</Select.Option>
                  <Select.Option value="Qatar">Qatar</Select.Option>
                  <Select.Option value="Reunion">Reunion</Select.Option>
                  <Select.Option value="Romania">Romania</Select.Option>
                  <Select.Option value="Russian Federation">Russian Federation</Select.Option>
                  <Select.Option value="Rwanda">Rwanda</Select.Option>
                  <Select.Option value="Saint Helena">Saint Helena</Select.Option>
                  <Select.Option value="Saint Kitts and Nevis">Saint Kitts and Nevis</Select.Option>
                  <Select.Option value="Saint Lucia">Saint Lucia</Select.Option>
                  <Select.Option value="Saint Pierre and Miquelon">
                    Saint Pierre and Miquelon
                  </Select.Option>
                  <Select.Option value="Saint Vincent and the Grenadines">
                    Saint Vincent and the Grenadines
                  </Select.Option>
                  <Select.Option value="Samoa">Samoa</Select.Option>
                  <Select.Option value="San Marino">San Marino</Select.Option>
                  <Select.Option value="Sao Tome and Principe">Sao Tome and Principe</Select.Option>
                  <Select.Option value="Saudi Arabia">Saudi Arabia</Select.Option>
                  <Select.Option value="Senegal">Senegal</Select.Option>
                  <Select.Option value="Seychelles">Seychelles</Select.Option>
                  <Select.Option value="Sierra Leone">Sierra Leone</Select.Option>
                  <Select.Option value="Singapore">Singapore</Select.Option>
                  <Select.Option value="Slovakia">Slovakia</Select.Option>
                  <Select.Option value="Slovenia">Slovenia</Select.Option>
                  <Select.Option value="Solomon Islands">Solomon Islands</Select.Option>
                  <Select.Option value="Somalia">Somalia</Select.Option>
                  <Select.Option value="South Africa">South Africa</Select.Option>
                  <Select.Option value="South Georgia and the South Sandwich Islands">
                    South Georgia and the South Sandwich Islands
                  </Select.Option>
                  <Select.Option value="Spain">Spain</Select.Option>
                  <Select.Option value="Sri Lanka">Sri Lanka</Select.Option>
                  <Select.Option value="Sudan">Sudan</Select.Option>
                  <Select.Option value="Suriname">Suriname</Select.Option>
                  <Select.Option value="Svalbard and Jan Mayen">
                    Svalbard and Jan Mayen
                  </Select.Option>
                  <Select.Option value="Eswatini">Eswatini</Select.Option>
                  <Select.Option value="Sweden">Sweden</Select.Option>
                  <Select.Option value="Switzerland">Switzerland</Select.Option>
                  <Select.Option value="Syrian Arab Republic">Syrian Arab Republic</Select.Option>
                  <Select.Option value="Taiwan">Taiwan</Select.Option>
                  <Select.Option value="Tajikistan">Tajikistan</Select.Option>
                  <Select.Option value="Tanzania, United Republic of">
                    Tanzania, United Republic of
                  </Select.Option>
                  <Select.Option value="Thailand">Thailand</Select.Option>
                  <Select.Option value="Timor-Leste">Timor-Leste</Select.Option>
                  <Select.Option value="Togo">Togo</Select.Option>
                  <Select.Option value="Tokelau">Tokelau</Select.Option>
                  <Select.Option value="Tonga">Tonga</Select.Option>
                  <Select.Option value="Trinidad and Tobago">Trinidad and Tobago</Select.Option>
                  <Select.Option value="Tunisia">Tunisia</Select.Option>
                  <Select.Option value="Turkey">Turkey</Select.Option>
                  <Select.Option value="Turkmenistan">Turkmenistan</Select.Option>
                  <Select.Option value="Turks and Caicos Islands">
                    Turks and Caicos Islands
                  </Select.Option>
                  <Select.Option value="Tuvalu">Tuvalu</Select.Option>
                  <Select.Option value="Uganda">Uganda</Select.Option>
                  <Select.Option value="Ukraine">Ukraine</Select.Option>
                  <Select.Option value="United Arab Emirates">United Arab Emirates</Select.Option>
                  <Select.Option value="United Kingdom">United Kingdom</Select.Option>
                  <Select.Option value="United States of America">
                    United States of America
                  </Select.Option>
                  <Select.Option value="United States Minor Outlying Islands">
                    United States Minor Outlying Islands
                  </Select.Option>
                  <Select.Option value="Uruguay">Uruguay</Select.Option>
                  <Select.Option value="Uzbekistan">Uzbekistan</Select.Option>
                  <Select.Option value="Vanuatu">Vanuatu</Select.Option>
                  <Select.Option value="Venezuela">Venezuela</Select.Option>
                  <Select.Option value="Vietnam">Vietnam</Select.Option>
                  <Select.Option value="Virgin Islands, British">
                    Virgin Islands, British
                  </Select.Option>
                  <Select.Option value="Virgin Islands, U.S.">Virgin Islands, U.S.</Select.Option>
                  <Select.Option value="Wallis and Futuna">Wallis and Futuna</Select.Option>
                  <Select.Option value="Western Sahara">Western Sahara</Select.Option>
                  <Select.Option value="Yemen">Yemen</Select.Option>
                  <Select.Option value="Zambia">Zambia</Select.Option>
                  <Select.Option value="Zimbabwe">Zimbabwe</Select.Option>
                  <Select.Option value="Åland Islands">Åland Islands</Select.Option>
                  <Select.Option value="Bonaire, Sint Eustatius and Saba">
                    Bonaire, Sint Eustatius and Saba
                  </Select.Option>
                  <Select.Option value="Curaçao">Curaçao</Select.Option>
                  <Select.Option value="Guernsey">Guernsey</Select.Option>
                  <Select.Option value="Isle of Man">Isle of Man</Select.Option>
                  <Select.Option value="Jersey">Jersey</Select.Option>
                  <Select.Option value="Montenegro">Montenegro</Select.Option>
                  <Select.Option value="Saint Barthélemy">Saint Barthélemy</Select.Option>
                  <Select.Option value="Saint Martin (French part)">
                    Saint Martin (French part)
                  </Select.Option>
                  <Select.Option value="Serbia">Serbia</Select.Option>
                  <Select.Option value="Sint Maarten (Dutch part)">
                    Sint Maarten (Dutch part)
                  </Select.Option>
                  <Select.Option value="South Sudan">South Sudan</Select.Option>
                  <Select.Option value="Kosovo">Kosovo</Select.Option>
                </Select>
              </div>

              <div className="col-span-2">
                <Input.TextArea
                  id="details"
                  name="details"
                  label="Additional Details"
                  placeholder="Tell us about your projects, clients, and technology..."
                  rows={10}
                />
              </div>

              <div className="flex flex-row-reverse w-full col-span-2 pt-4">
                <Button
                  size="xlarge"
                  disabled={formSubmitted}
                  loading={isSubmitting}
                  htmlType="submit"
                >
                  Send
                </Button>
              </div>
            </div>
          )}
        </Form>

        {formSubmitted && <h3 className="h3">Thanks, we'll reach out to you shortly 👁⚡️👁</h3>}
      </div>
    </div>
  )
}
