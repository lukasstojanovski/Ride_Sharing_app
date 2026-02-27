export interface Country {
  name: string;
  nameМК: string;
  code: string;   // dial code e.g. +389
  iso: string;    // ISO 3166-1 alpha-2 e.g. MK
  flag: string;   // emoji flag
}

export const europeanCountries: Country[] = [
  { name: 'Albania',        nameМК: 'Албанија',        code: '+355', iso: 'AL', flag: '🇦🇱' },
  { name: 'Andorra',        nameМК: 'Андора',           code: '+376', iso: 'AD', flag: '🇦🇩' },
  { name: 'Austria',        nameМК: 'Австрија',         code: '+43',  iso: 'AT', flag: '🇦🇹' },
  { name: 'Belarus',        nameМК: 'Белорусија',       code: '+375', iso: 'BY', flag: '🇧🇾' },
  { name: 'Belgium',        nameМК: 'Белгија',          code: '+32',  iso: 'BE', flag: '🇧🇪' },
  { name: 'Bosnia',         nameМК: 'Босна',            code: '+387', iso: 'BA', flag: '🇧🇦' },
  { name: 'Bulgaria',       nameМК: 'Бугарија',         code: '+359', iso: 'BG', flag: '🇧🇬' },
  { name: 'Croatia',        nameМК: 'Хрватска',         code: '+385', iso: 'HR', flag: '🇭🇷' },
  { name: 'Cyprus',         nameМК: 'Кипар',            code: '+357', iso: 'CY', flag: '🇨🇾' },
  { name: 'Czech Republic', nameМК: 'Чешка',            code: '+420', iso: 'CZ', flag: '🇨🇿' },
  { name: 'Denmark',        nameМК: 'Данска',           code: '+45',  iso: 'DK', flag: '🇩🇰' },
  { name: 'Estonia',        nameМК: 'Естонија',         code: '+372', iso: 'EE', flag: '🇪🇪' },
  { name: 'Finland',        nameМК: 'Финска',           code: '+358', iso: 'FI', flag: '🇫🇮' },
  { name: 'France',         nameМК: 'Франција',         code: '+33',  iso: 'FR', flag: '🇫🇷' },
  { name: 'Germany',        nameМК: 'Германија',        code: '+49',  iso: 'DE', flag: '🇩🇪' },
  { name: 'Greece',         nameМК: 'Грција',           code: '+30',  iso: 'GR', flag: '🇬🇷' },
  { name: 'Hungary',        nameМК: 'Унгарија',         code: '+36',  iso: 'HU', flag: '🇭🇺' },
  { name: 'Iceland',        nameМК: 'Исланд',           code: '+354', iso: 'IS', flag: '🇮🇸' },
  { name: 'Ireland',        nameМК: 'Ирска',            code: '+353', iso: 'IE', flag: '🇮🇪' },
  { name: 'Italy',          nameМК: 'Италија',          code: '+39',  iso: 'IT', flag: '🇮🇹' },
  { name: 'Kosovo',         nameМК: 'Косово',           code: '+383', iso: 'XK', flag: '🇽🇰' },
  { name: 'Latvia',         nameМК: 'Латвија',          code: '+371', iso: 'LV', flag: '🇱🇻' },
  { name: 'Liechtenstein',  nameМК: 'Лихтенштајн',     code: '+423', iso: 'LI', flag: '🇱🇮' },
  { name: 'Lithuania',      nameМК: 'Литванија',        code: '+370', iso: 'LT', flag: '🇱🇹' },
  { name: 'Luxembourg',     nameМК: 'Луксембург',       code: '+352', iso: 'LU', flag: '🇱🇺' },
  { name: 'Malta',          nameМК: 'Малта',            code: '+356', iso: 'MT', flag: '🇲🇹' },
  { name: 'Moldova',        nameМК: 'Молдавија',        code: '+373', iso: 'MD', flag: '🇲🇩' },
  { name: 'Monaco',         nameМК: 'Монако',           code: '+377', iso: 'MC', flag: '🇲🇨' },
  { name: 'Montenegro',     nameМК: 'Црна Гора',        code: '+382', iso: 'ME', flag: '🇲🇪' },
  { name: 'Netherlands',    nameМК: 'Холандија',        code: '+31',  iso: 'NL', flag: '🇳🇱' },
  { name: 'North Macedonia',nameМК: 'Македонија',       code: '+389', iso: 'MK', flag: '🇲🇰' },
  { name: 'Norway',         nameМК: 'Норвешка',         code: '+47',  iso: 'NO', flag: '🇳🇴' },
  { name: 'Poland',         nameМК: 'Полска',           code: '+48',  iso: 'PL', flag: '🇵🇱' },
  { name: 'Portugal',       nameМК: 'Португалија',      code: '+351', iso: 'PT', flag: '🇵🇹' },
  { name: 'Romania',        nameМК: 'Романија',         code: '+40',  iso: 'RO', flag: '🇷🇴' },
  { name: 'San Marino',     nameМК: 'Сан Марино',       code: '+378', iso: 'SM', flag: '🇸🇲' },
  { name: 'Serbia',         nameМК: 'Србија',           code: '+381', iso: 'RS', flag: '🇷🇸' },
  { name: 'Slovakia',       nameМК: 'Словачка',         code: '+421', iso: 'SK', flag: '🇸🇰' },
  { name: 'Slovenia',       nameМК: 'Словенија',        code: '+386', iso: 'SI', flag: '🇸🇮' },
  { name: 'Spain',          nameМК: 'Шпанија',          code: '+34',  iso: 'ES', flag: '🇪🇸' },
  { name: 'Sweden',         nameМК: 'Шведска',          code: '+46',  iso: 'SE', flag: '🇸🇪' },
  { name: 'Switzerland',    nameМК: 'Швајцарија',       code: '+41',  iso: 'CH', flag: '🇨🇭' },
  { name: 'Turkey',         nameМК: 'Турција',          code: '+90',  iso: 'TR', flag: '🇹🇷' },
  { name: 'Ukraine',        nameМК: 'Украина',          code: '+380', iso: 'UA', flag: '🇺🇦' },
  { name: 'United Kingdom', nameМК: 'Велика Британија', code: '+44',  iso: 'GB', flag: '🇬🇧' },
];

// Default to North Macedonia
export const defaultCountry = europeanCountries.find(c => c.iso === 'MK')!;
