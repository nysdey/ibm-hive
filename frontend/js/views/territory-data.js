/**
 * territory-data.js — seed presets for the Territory Coverage view.
 *
 * Each entry is a manager / role coverage slice. territory.js combines slices
 * that share a market into one map so overlapping assignments remain visible.
 * `states` is a space-separated list of USPS codes;
 * territories use GU MP AS VI PR (PR/GU/MP/AS/VI render as inset tiles, the 50
 * states + DC render as real geographic shapes).
 *
 * These are STARTING points — the view is editable and saves per-user, so any
 * assignment can be corrected in-app. A rep may carry an optional `sub` line
 * (used by the Industrial market, where each territory has a BTSS/TSS pair).
 */

const V = (id, manager, role, market, reps) => ({ id, manager, role, market, reps });
const R = (name, color, states, sub) => ({ name, color, states: states.trim().split(/\s+/).filter(Boolean), sub: sub || null });

export const TERRITORY_VIEWS = [
  V('tss-comms', 'Rob Mason', 'TSS Manager', 'Comms / Distribution', [
    R('Ryan Hinegarder', '#4a4a4a', 'NY NJ'),
    R('Ross Holley',     '#5bc2b6', 'ME NH VT MA CT RI'),
    R('Robert Brendle',  '#e0342c', 'MI IN OH PA'),
    R('Negusu Mulu',     '#7a2fa0', 'WI IL'),
    R('Jackson France',  '#9dc3e6', 'VA WV KY TN NC SC MD DC DE'),
    R('Rick Morse',      '#f2e400', 'FL GA AL MS PR'),
    R('OPEN — California', '#2f6db5', 'CA'),
    R('OPEN — Plains',     '#e8b98f', 'ND SD NE KS OK MN IA MO AR'),
    R('Hayden King',     '#92d050', 'NV UT CO WY AZ NM TX LA'),
    R('Patrick McBride', '#f6c6da', 'WA OR ID MT AK HI GU MP AS'),
  ]),

  V('tss-fss', 'Aaron Carman', 'TSS Manager', 'FSS / Public', [
    R('Cam Webster',       '#2e7d32', 'ME NH VT MA'),
    R('Rob Battrick',      '#9dc3e6', 'WV VA KY TN NC SC MD DC DE'),
    R('Nick Hoang',        '#1a237e', 'NY NJ CT'),
    R('Rick Monroy',       '#f2e400', 'MS AL GA FL PR'),
    R('Amber Cowen',       '#2f9e8f', 'WA OR ID MT ND SD MN WY AK'),
    R('Andy Hall',         '#b0a7d6', 'WI MI IL IN'),
    R('Herman Leonard',    '#e0342c', 'OH PA'),
    R('Delisha Alexander', '#f4a83a', 'NE IA KS MO OK AR'),
    R('Tim Zhou',          '#7a2fa0', 'CA HI GU MP AS VI'),
    R('Joe Broadway',      '#3a3a3a', 'TX LA'),
    R('Noah Legagneur',    '#f6c6da', 'NV UT CO AZ NM'),
    R('Joer Bombase',      '#c94b6a', 'RI'),
  ]),

  V('btss-comms', 'Chris Kennedy', 'BTSS Manager', 'Comms / Distribution', [
    R('John Tatum',        '#c0392b', 'CA AL GA MS HI'),
    R('OPEN — FL / PR',    '#1f3a93', 'FL PR'),
    R('Annie Sanderson',   '#4db8d4', 'KY TN NC SC'),
    R('Morgan Mckeithan',  '#e5533c', 'VA WV MD DC DE'),
    R('OPEN — Great Lakes','#f0c987', 'MI IN OH PA', 'MI / IN / OH / PA West'),
    R('Roshan Dave',       '#f2e400', 'NY NJ PA', 'NY / NJ / PA East'),
    R('Mark Hoffman',      '#2e9c3c', 'CT MA NH ME VT RI NJ', 'NY City'),
    R('Demetrius Bell Jr', '#f5f0a0', 'TX LA'),
    R('OPEN — WI / IL',    '#808080', 'WI IL'),
    R('Armada Veraepalli', '#d6d6d6', 'WA OR ID MT ND SD MN AK'),
    R('Jacob Kim',         '#d94a6a', 'NE KS OK IA MO AR'),
    R('OPEN — Mountain West', '#7a1f3d', 'NV UT CO WY AZ NM'),
  ]),

  V('btss-fss', 'Cale Webster', 'BTSS Manager', 'FSS / Public', [
    R('Anjali James',     '#a8d5ba', 'WA OR ID MT ND SD MN CA AK HI'),
    R('Ari Benoit',       '#e0342c', 'NV UT AZ NM CO WY'),
    R('Aditya Phadke',    '#6a9bd0', 'TX LA'),
    R('Prenav Ramesh',    '#ef7d22', 'NE IA KS MO OK AR IN MI'),
    R('Steven Gasinski',  '#7a2fa0', 'WI IL'),
    R('Carey Slaker',     '#3a3a3a', 'NY NJ'),
    R('Diamond Charlotin','#d4a017', 'DE'),
    R('Carlos Walker',    '#1f6b3a', 'WV VA'),
    R('Sherman Brewster', '#f7f0b0', 'MS AL GA'),
    R('Manny Divedia',    '#b99a6b', 'OH PA'),
    R('Luther Payton',    '#9bd05a', 'ME NH VT MA CT RI'),
    R('Rob Slack',        '#f6c6da', 'KY TN NC SC FL PR'),
  ]),

  V('ind', 'Michael Slade (TSS) · Alan Kidd (BTSS)', 'Industrial Market', 'Industrial', [
    R('MN-ND-SD-AK-ID-MT-OR-WA', '#2f5aa8', 'MN ND SD AK ID MT OR WA', 'BTSS Meredith McCurdy · TSS Barry Long'),
    R('CA North',                '#cdbfe8', 'CA',                       'BTSS Thorston Thorpe · TSS Greg Harris'),
    R('CA South-GU-HI-MP',       '#7a52c9', 'HI GU MP',                 'BTSS Chad Benton · TSS Gary Motmans'),
    R('CO-WY-UT-AZ-NM-NV',       '#cbe8c0', 'CO WY UT AZ NM NV',        'BTSS TBD · TSS TBD'),
    R('AR-IA-KS-MO-NE-OK',       '#ecd9a8', 'AR IA KS MO NE OK',        'BTSS TBD · TSS TBD'),
    R('TX-LA',                   '#e08a4e', 'TX LA',                    'BTSS Anish Omprakash · TSS Mark Arnold'),
    R('IL-WI',                   '#3f7fd0', 'IL WI',                    'BTSS Aiden Lundy · TSS Jon Poulos'),
    R('IN-MI',                   '#a7c7e7', 'IN MI',                    'BTSS Aiden Lundy · TSS Neal Echols'),
    R('KY-TN-NC-SC',             '#f7f0b0', 'KY TN NC SC',              'BTSS Chris Camacho · TSS Robert Bailey'),
    R('AL-GA-MS',                '#f2c0c0', 'AL GA MS',                 'BTSS Harold Gill · TSS Alycea Adams'),
    R('FL-PR-USVI',              '#b5453a', 'FL PR VI',                 'BTSS Andy Tran · TSS Alfredo Salman'),
    R('OH-PA',                   '#d6ecec', 'OH PA',                    'BTSS Dana Clark · TSS Kelsey Zehnder'),
    R('DC-DE-MD-WV-VA',          '#e5c96a', 'DC DE MD WV VA',           'BTSS Nana Kwame Afriyie Peasah · TSS TBD'),
    R('NJ-NY',                   '#7fc9bf', 'NJ NY',                    'BTSS Yonis Saleh · TSS Rezell Simmons'),
    R('CT-MA-ME-NH-RI-VT',       '#1f6b5c', 'CT MA ME NH RI VT',        'BTSS Matt Panora · TSS Eddie Finnell'),
  ]),

  V('bts-storage', 'Adrian Meghoo', 'BTS Manager', 'Storage', [
    R('David Masefield', '#f2e400', 'NY PA NJ CT MA NH VT ME RI'),
    R('Jeff Anderson',   '#2f6db5', 'VA WV KY TN NC SC GA AL MS FL MD DC DE PR VI'),
    R('Jeff Gillespie',  '#2f9e8f', 'ND SD NE KS OK MN IA MO WI IL IN MI OH AR'),
    R('Roy Peek',        '#ef7d22', 'WA OR CA NV ID MT WY UT CO AZ NM TX LA AK HI GU MP AS'),
  ]),

  V('bts-powercloud', 'Adrian Meghoo', 'BTS Manager', 'Power / Cloud', [
    R('Alejandro Mahomar', '#1f6b3a', 'NJ'),
    R('Doug Jackson',      '#ef7d22', 'CA AK HI GU MP AS'),
    R('Eric Maxie',        '#c0397a', 'OH WV KY VA NC SC'),
    R('J.O. Stout',        '#2f6db5', 'TN MS AL GA FL PR VI'),
    R('Kameron McKeeth',   '#2f9e8f', 'MN WI MI IL IN'),
    R('Matthew Klima',     '#92d050', 'WA OR ID MT ND SD NE IA KS MO OK AR'),
    R('Robert Ryan',       '#f2e400', 'NY PA ME NH VT MA CT RI'),
    R('Ryan Tiffany',      '#a7c7e7', 'WY UT CO NM AZ TX LA NV'),
  ]),
];

// Territories drawn as inset tiles (not in the Albers projection).
export const TERRITORY_TILES = ['PR', 'GU', 'MP', 'AS', 'VI'];
export const TERRITORY_TILE_NAMES = {
  PR: 'Puerto Rico', GU: 'Guam', MP: 'N. Mariana Is.', AS: 'American Samoa', VI: 'U.S.V.I.',
};
