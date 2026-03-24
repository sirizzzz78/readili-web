/**
 * Maps numeric ISO 3166-1 country codes (as strings) to readiLi continent names.
 * Derived from Natural Earth countries-110m dataset (177 features).
 * Americas split into "North America" and "South America" per country.
 */
export const isoToContinentMap: Record<string, string> = {
  // ── North America ──
  '124': 'North America', // Canada
  '840': 'North America', // United States
  '484': 'North America', // Mexico
  '320': 'North America', // Guatemala
  '084': 'North America', // Belize
  '340': 'North America', // Honduras
  '222': 'North America', // El Salvador
  '558': 'North America', // Nicaragua
  '188': 'North America', // Costa Rica
  '591': 'North America', // Panama
  '192': 'North America', // Cuba
  '332': 'North America', // Haiti
  '214': 'North America', // Dominican Rep.
  '044': 'North America', // Bahamas
  '388': 'North America', // Jamaica
  '630': 'North America', // Puerto Rico
  '780': 'North America', // Trinidad and Tobago
  '304': 'North America', // Greenland

  // ── South America ──
  '032': 'South America', // Argentina
  '068': 'South America', // Bolivia
  '076': 'South America', // Brazil
  '152': 'South America', // Chile
  '170': 'South America', // Colombia
  '218': 'South America', // Ecuador
  '238': 'South America', // Falkland Is.
  '328': 'South America', // Guyana
  '600': 'South America', // Paraguay
  '604': 'South America', // Peru
  '740': 'South America', // Suriname
  '858': 'South America', // Uruguay
  '862': 'South America', // Venezuela

  // ── Europe ──
  '008': 'Europe', // Albania
  '040': 'Europe', // Austria
  '056': 'Europe', // Belgium
  '070': 'Europe', // Bosnia and Herz.
  '100': 'Europe', // Bulgaria
  '112': 'Europe', // Belarus
  '191': 'Europe', // Croatia
  '196': 'Europe', // Cyprus
  '203': 'Europe', // Czechia
  '208': 'Europe', // Denmark
  '233': 'Europe', // Estonia
  '246': 'Europe', // Finland
  '250': 'Europe', // France
  '276': 'Europe', // Germany
  '300': 'Europe', // Greece
  '348': 'Europe', // Hungary
  '352': 'Europe', // Iceland
  '372': 'Europe', // Ireland
  '380': 'Europe', // Italy
  '428': 'Europe', // Latvia
  '440': 'Europe', // Lithuania
  '442': 'Europe', // Luxembourg
  '498': 'Europe', // Moldova
  '499': 'Europe', // Montenegro
  '528': 'Europe', // Netherlands
  '578': 'Europe', // Norway
  '616': 'Europe', // Poland
  '620': 'Europe', // Portugal
  '642': 'Europe', // Romania
  '688': 'Europe', // Serbia
  '703': 'Europe', // Slovakia
  '705': 'Europe', // Slovenia
  '724': 'Europe', // Spain
  '752': 'Europe', // Sweden
  '756': 'Europe', // Switzerland
  '804': 'Europe', // Ukraine
  '807': 'Europe', // Macedonia
  '826': 'Europe', // United Kingdom

  // ── Africa ──
  '012': 'Africa', // Algeria
  '024': 'Africa', // Angola
  '072': 'Africa', // Botswana
  '108': 'Africa', // Burundi
  '120': 'Africa', // Cameroon
  '140': 'Africa', // Central African Rep.
  '148': 'Africa', // Chad
  '178': 'Africa', // Congo
  '180': 'Africa', // Dem. Rep. Congo
  '204': 'Africa', // Benin
  '226': 'Africa', // Eq. Guinea
  '231': 'Africa', // Ethiopia
  '232': 'Africa', // Eritrea
  '262': 'Africa', // Djibouti
  '266': 'Africa', // Gabon
  '270': 'Africa', // Gambia
  '288': 'Africa', // Ghana
  '324': 'Africa', // Guinea
  '384': 'Africa', // Côte d'Ivoire
  '404': 'Africa', // Kenya
  '426': 'Africa', // Lesotho
  '430': 'Africa', // Liberia
  '434': 'Africa', // Libya
  '450': 'Africa', // Madagascar
  '454': 'Africa', // Malawi
  '466': 'Africa', // Mali
  '478': 'Africa', // Mauritania
  '504': 'Africa', // Morocco
  '508': 'Africa', // Mozambique
  '516': 'Africa', // Namibia
  '562': 'Africa', // Niger
  '566': 'Africa', // Nigeria
  '624': 'Africa', // Guinea-Bissau
  '646': 'Africa', // Rwanda
  '686': 'Africa', // Senegal
  '694': 'Africa', // Sierra Leone
  '706': 'Africa', // Somalia
  '710': 'Africa', // South Africa
  '716': 'Africa', // Zimbabwe
  '728': 'Africa', // S. Sudan
  '729': 'Africa', // Sudan
  '732': 'Africa', // W. Sahara
  '748': 'Africa', // eSwatini
  '768': 'Africa', // Togo
  '788': 'Africa', // Tunisia
  '800': 'Africa', // Uganda
  '818': 'Africa', // Egypt
  '834': 'Africa', // Tanzania
  '854': 'Africa', // Burkina Faso
  '894': 'Africa', // Zambia

  // ── Asia ──
  '004': 'Asia', // Afghanistan
  '031': 'Asia', // Azerbaijan
  '050': 'Asia', // Bangladesh
  '051': 'Asia', // Armenia
  '064': 'Asia', // Bhutan
  '096': 'Asia', // Brunei
  '104': 'Asia', // Myanmar
  '116': 'Asia', // Cambodia
  '156': 'Asia', // China
  '158': 'Asia', // Taiwan
  '268': 'Asia', // Georgia
  '356': 'Asia', // India
  '360': 'Asia', // Indonesia
  '364': 'Asia', // Iran
  '368': 'Asia', // Iraq
  '376': 'Asia', // Israel
  '392': 'Asia', // Japan
  '398': 'Asia', // Kazakhstan
  '400': 'Asia', // Jordan
  '408': 'Asia', // North Korea
  '410': 'Asia', // South Korea
  '414': 'Asia', // Kuwait
  '417': 'Asia', // Kyrgyzstan
  '418': 'Asia', // Laos
  '422': 'Asia', // Lebanon
  '458': 'Asia', // Malaysia
  '496': 'Asia', // Mongolia
  '512': 'Asia', // Oman
  '524': 'Asia', // Nepal
  '275': 'Asia', // Palestine
  '586': 'Asia', // Pakistan
  '608': 'Asia', // Philippines
  '634': 'Asia', // Qatar
  '643': 'Asia', // Russia
  '682': 'Asia', // Saudi Arabia
  '144': 'Asia', // Sri Lanka
  '760': 'Asia', // Syria
  '762': 'Asia', // Tajikistan
  '764': 'Asia', // Thailand
  '626': 'Asia', // Timor-Leste
  '792': 'Asia', // Turkey
  '795': 'Asia', // Turkmenistan
  '784': 'Asia', // United Arab Emirates
  '860': 'Asia', // Uzbekistan
  '704': 'Asia', // Vietnam
  '887': 'Asia', // Yemen

  // ── Oceania ──
  '036': 'Oceania', // Australia
  '090': 'Oceania', // Solomon Is.
  '242': 'Oceania', // Fiji
  '540': 'Oceania', // New Caledonia
  '548': 'Oceania', // Vanuatu
  '554': 'Oceania', // New Zealand
  '598': 'Oceania', // Papua New Guinea

  // ── Antarctica ──
  '010': 'Antarctica', // Antarctica
  '260': 'Antarctica', // Fr. S. Antarctic Lands
};
