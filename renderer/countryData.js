// ISO 3166-1 alpha-2 country code mapping
// Maps recipe tags (country names, adjectives) to 2-letter ISO country codes
// The new world.svg uses ISO codes like 'PT', 'ES', 'IT', etc. as IDs
export const countryMapping = {
    // Europe
    'portugal': 'PT', 'portuguese': 'PT',
    'spain': 'ES', 'spanish': 'ES',
    'france': 'FR', 'french': 'FR',
    'italy': 'IT', 'italian': 'IT',
    'germany': 'DE', 'german': 'DE',
    'uk': 'GB', 'united kingdom': 'GB', 'britain': 'GB', 'british': 'GB', 'england': 'GB', 'english': 'GB',
    'greece': 'GR', 'greek': 'GR',
    'poland': 'PL', 'polish': 'PL',
    'netherlands': 'NL', 'dutch': 'NL', 'holland': 'NL',
    'belgium': 'BE', 'belgian': 'BE',
    'austria': 'AT', 'austrian': 'AT',
    'switzerland': 'CH', 'swiss': 'CH',
    'sweden': 'SE', 'swedish': 'SE',
    'norway': 'NO', 'norwegian': 'NO',
    'denmark': 'DK', 'danish': 'DK',
    'finland': 'FI', 'finnish': 'FI',
    'ireland': 'IE', 'irish': 'IE',
    'russia': 'RU', 'russian': 'RU',
    'ukraine': 'UA', 'ukrainian': 'UA',
    'romania': 'RO', 'romanian': 'RO',
    'czech republic': 'CZ', 'czech': 'CZ', 'czechia': 'CZ',
    'hungary': 'HU', 'hungarian': 'HU',
    'croatia': 'HR', 'croatian': 'HR',
    'serbia': 'RS', 'serbian': 'RS',
    'bulgaria': 'BG', 'bulgarian': 'BG',
    'slovakia': 'SK', 'slovak': 'SK',
    'slovenia': 'SI', 'slovenian': 'SI',
    'lithuania': 'LT', 'lithuanian': 'LT',
    'latvia': 'LV', 'latvian': 'LV',
    'estonia': 'EE', 'estonian': 'EE',
    'iceland': 'IS', 'icelandic': 'IS',
    'albania': 'AL', 'albanian': 'AL',
    'malta': 'MT', 'maltese': 'MT',
    'cyprus': 'CY', 'cypriot': 'CY',
    'luxembourg': 'LU', 'luxembourgish': 'LU',
    'monaco': 'MC', 'monegaske': 'MC',
    'andorra': 'AD', 'andorran': 'AD',
    'san marino': 'SM', 'sammarinese': 'SM',
    'vatican city': 'VA', 'vatican': 'VA',
    'moldova': 'MD', 'moldovan': 'MD',
    'belarus': 'BY', 'belarusian': 'BY',
    'bosnia and herzegovina': 'BA', 'bosnia': 'BA', 'bosnian': 'BA',
    'montenegro': 'ME', 'montenegrin': 'ME',
    'north macedonia': 'MK', 'macedonian': 'MK',
    'georgia': 'GE', 'georgian': 'GE',
    'armenia': 'AM', 'armenian': 'AM',
    'azerbaijan': 'AZ', 'azerbaijani': 'AZ',
    'liechtenstein': 'LI', 'liechtensteiner': 'LI',

    // Asia
    'china': 'CN', 'chinese': 'CN', 'hong kong': 'HK', 'macau': 'MO',
    'japan': 'JP', 'japanese': 'JP',
    'korea': 'KR', 'south korea': 'KR', 'korean': 'KR',
    'north korea': 'KP',
    'india': 'IN', 'indian': 'IN',
    'thailand': 'TH', 'thai': 'TH',
    'vietnam': 'VN', 'vietnamese': 'VN',
    'philippines': 'PH', 'filipino': 'PH',
    'indonesia': 'ID', 'indonesian': 'ID',
    'malaysia': 'MY', 'malaysian': 'MY',
    'singapore': 'SG', 'singaporean': 'SG',
    'turkey': 'TR', 'turkish': 'TR', 'türkiye': 'TR',
    'iran': 'IR', 'iranian': 'IR', 'persia': 'IR', 'persian': 'IR',
    'israel': 'IL', 'israeli': 'IL', 'palestine': 'PS', 'palestinian': 'PS',
    'lebanon': 'LB', 'lebanese': 'LB',
    'saudi arabia': 'SA', 'saudi': 'SA',
    'uae': 'AE', 'united arab emirates': 'AE', 'emirates': 'AE', 'emirati': 'AE',
    'pakistan': 'PK', 'pakistani': 'PK',
    'bangladesh': 'BD', 'bangladeshi': 'BD',
    'afghanistan': 'AF', 'afghan': 'AF',
    'iraq': 'IQ', 'iraqi': 'IQ',
    'syria': 'SY', 'syrian': 'SY',
    'jordan': 'JO', 'jordanian': 'JO',
    'taiwan': 'TW', 'taiwanese': 'TW',
    'sri lanka': 'LK', 'sri lankan': 'LK',
    'nepal': 'NP', 'nepalese': 'NP', 'nepali': 'NP',
    'mongolia': 'MN', 'mongolian': 'MN',
    'cambodia': 'KH', 'cambodian': 'KH', 'khmer': 'KH',
    'laos': 'LA', 'laotian': 'LA',
    'myanmar': 'MM', 'burma': 'MM', 'burmese': 'MM',
    'macau': 'MO', 'macanese': 'MO',
    'uzbekistan': 'UZ', 'uzbek': 'UZ',
    'kazakhstan': 'KZ', 'kazakh': 'KZ',
    'kyrgyzstan': 'KG', 'kyrgyz': 'KG',
    'tajikistan': 'TJ', 'tajik': 'TJ',
    'turkmenistan': 'TM', 'turkmen': 'TM',
    'bhutan': 'BT', 'bhutanese': 'BT',
    'maldives': 'MV', 'maldivian': 'MV',
    'brunei': 'BN', 'bruneian': 'BN',
    'timor-leste': 'TL', 'east timor': 'TL',
    'bahrain': 'BH', 'bahraini': 'BH',
    'kuwait': 'KW', 'kuwaiti': 'KW',
    'oman': 'OM', 'omani': 'OM',
    'qatar': 'QA', 'qatari': 'QA',
    'yemen': 'YE', 'yemeni': 'YE',

    // Americas
    'usa': 'US', 'united states': 'US', 'america': 'US', 'american': 'US', 'us': 'US',
    'mexico': 'MX', 'mexican': 'MX',
    'canada': 'CA', 'canadian': 'CA',
    'brazil': 'BR', 'brazilian': 'BR',
    'argentina': 'AR', 'argentinian': 'AR', 'argentine': 'AR',
    'chile': 'CL', 'chilean': 'CL',
    'peru': 'PE', 'peruvian': 'PE',
    'colombia': 'CO', 'colombian': 'CO',
    'venezuela': 'VE', 'venezuelan': 'VE',
    'paraguay': 'PY', 'paraguayan': 'PY',
    'uruguay': 'UY', 'uruguayan': 'UY',
    'ecuador': 'EC', 'ecuadorian': 'EC',
    'bolivia': 'BO', 'bolivian': 'BO',
    'guyana': 'GY', 'guyanese': 'GY',
    'suriname': 'SR', 'surinamese': 'SR',
    'french guiana': 'GF',
    'panama': 'PA', 'panamanian': 'PA',
    'costa rica': 'CR', 'costa rican': 'CR',
    'nicaragua': 'NI', 'nicaraguan': 'NI',
    'honduras': 'HN', 'honduran': 'HN',
    'el salvador': 'SV', 'salvadoran': 'SV',
    'guatemala': 'GT', 'guatemalan': 'GT',
    'belize': 'BZ', 'belizean': 'BZ',
    'cuba': 'CU', 'cuban': 'CU',
    'jamaica': 'JM', 'jamaican': 'JM',
    'haiti': 'HT', 'haitian': 'HT',
    'dominican republic': 'DO', 'dominican': 'DO',
    'puerto rico': 'PR', 'puerto rican': 'PR',
    'bahamas': 'BS', 'bahamian': 'BS',
    'barbados': 'BB', 'barbadian': 'BB',
    'trinidad and tobago': 'TT', 'trinidadian': 'TT',
    'st. lucia': 'LC', 'saint lucia': 'LC',
    'grenada': 'GD', 'grenadian': 'GD',
    'st. vincent': 'VC', 'saint vincent': 'VC',
    'st. kitts': 'KN', 'saint kitts': 'KN',
    'antigua': 'AG', 'antigua and barbuda': 'AG',
    'dominica': 'DM', 'dominican': 'DM',

    // Africa
    'morocco': 'MA', 'moroccan': 'MA',
    'egypt': 'EG', 'egyptian': 'EG',
    'south africa': 'ZA', 'south african': 'ZA',
    'ethiopia': 'ET', 'ethiopian': 'ET',
    'nigeria': 'NG', 'nigerian': 'NG',
    'kenya': 'KE', 'kenyan': 'KE',
    'tunisia': 'TN', 'tunisian': 'TN',
    'algeria': 'DZ', 'algerian': 'DZ',
    'libya': 'LY', 'libyan': 'LY',
    'senegal': 'SN', 'senegalese': 'SN',
    'ghana': 'GH', 'ghanaian': 'GH',
    'ivory coast': 'CI', 'cote d\'ivoire': 'CI', 'ivoirian': 'CI',
    'cameroon': 'CM', 'cameroonian': 'CM',
    'uganda': 'UG', 'ugandan': 'UG',
    'tanzania': 'TZ', 'tanzanian': 'TZ',
    'zimbabwe': 'ZW', 'zimbabwean': 'ZW',
    'zambia': 'ZM', 'zambian': 'ZM',
    'angola': 'AO', 'angolan': 'AO',
    'mozambique': 'MZ', 'mozambican': 'MZ',
    'madagascar': 'MG', 'malagasy': 'MG',
    'mauritius': 'MU', 'mauritian': 'MU',
    'namibia': 'NA', 'namibian': 'NA',
    'botswana': 'BW', 'botswanan': 'BW',
    'rwanda': 'RW', 'rwandan': 'RW',
    'sudan': 'SD', 'sudanese': 'SD',
    'mali': 'ML', 'malian': 'ML',
    'congo': 'CG', 'congolese': 'CG',
    'dr congo': 'CD',
    'somalia': 'SO', 'somali': 'SO',
    'benin': 'BJ', 'beninese': 'BJ',
    'burkina faso': 'BF', 'burkinabe': 'BF',
    'burundi': 'BI', 'burundian': 'BI',
    'cape verde': 'CV', 'cabo verde': 'CV',
    'central african republic': 'CF',
    'chad': 'TD', 'chadian': 'TD',
    'comoros': 'KM', 'comorian': 'KM',
    'djibouti': 'DJ', 'djiboutian': 'DJ',
    'equatorial guinea': 'GQ',
    'eritrea': 'ER', 'eritrean': 'ER',
    'eswatini': 'SZ', 'swaziland': 'SZ',
    'gabon': 'GA', 'gabonese': 'GA',
    'gambia': 'GM', 'gambian': 'GM',
    'guinea': 'GN', 'guinean': 'GN',
    'guinea-Bissau': 'GW',
    'lesotho': 'LS', 'basotho': 'LS',
    'liberia': 'LR', 'liberian': 'LR',
    'malawi': 'MW', 'malawian': 'MW',
    'mauritania': 'MR', 'mauritanian': 'MR',
    'niger': 'NE', 'nigerien': 'NE',
    'sao tome': 'ST', 'sao tome and principe': 'ST',
    'seychelles': 'SC', 'seychellois': 'SC',
    'sierra leone': 'SL', 'sierra leonean': 'SL',
    'togo': 'TG', 'togolese': 'TG',
    'south sudan': 'SS',
    'mauritania': 'MR',

    // Oceania
    'australia': 'AU', 'australian': 'AU',
    'new zealand': 'NZ', 'new zealander': 'NZ', 'kiwi': 'NZ',
    'fiji': 'FJ', 'fijian': 'FJ',
    'papua new guinea': 'PG', 'papuan': 'PG',
    'samoa': 'WS', 'samoan': 'WS',
    'tonga': 'TO', 'tongan': 'TO',
    'vanuatu': 'VU', 'vanuatuan': 'VU',
    'kiribati': 'KI', 'i-kiribati': 'KI',
    'marshall islands': 'MH',
    'micronesia': 'FM', 'micronesian': 'FM',
    'nauru': 'NR', 'nauruan': 'NR',
    'palau': 'PW', 'palauan': 'PW',
    'solomon islands': 'SB',
    'tuvalu': 'TV', 'tuvaluan': 'TV',
};

export function getCountryIdFromTag(tag) {
    if (!tag) return null;
    const lowerTag = tag.trim().toLowerCase();
    return countryMapping[lowerTag] || null;
}

export function getAllCountries() {
    return [...new Set(Object.values(countryMapping))];
}

export function getAdjectiveFromId(countryId) {
    if (!countryId) return null;
    if (countryId === 'other') return 'Global / Other';
    
    // Find all mapping keys for this ID
    const entries = Object.entries(countryMapping).filter(([key, val]) => val === countryId);
    
    if (entries.length > 0) {
        // Heuristic to pick the best adjective for titles
        // We prioritize keys that end in common adjective suffixes
        const adjSuffixes = ['ese', 'an', 'ish', 'ic', 'i', 'k', 'h'];
        
        const scoredEntries = entries.map(([key, val]) => {
            let score = key.length;
            // Boost score for common adjective suffixes
            if (adjSuffixes.some(s => key.endsWith(s))) score += 100;
            // Penalize formal multi-word names that aren't adjectives (like "United States")
            if (key.includes(' ') && !adjSuffixes.some(s => key.endsWith(s))) score -= 50;
            return { key, score };
        });
        
        const bestKey = scoredEntries.sort((a, b) => b.score - a.score)[0].key;
        // Capitalize words
        return bestKey.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    
    return countryId;
}
