// =====================================================================
//  FIT CHECK - Dialogflow ES agent definition (the rule-based brain)
// =====================================================================
// Every reply below is hard-coded. Dialogflow only decides WHICH intent
// matches; the words come from this file. The quiz is a decision tree
// built with Dialogflow input/output contexts (2 x 2 x 2 = 8 outcomes).
//
//   npm run build:agent   -> writes dialogflow-agent/ and FitCheck-Dialogflow-ES.zip
//
// Facts checked November 2026. Sources are listed at the bottom and are
// also used by the optional AI polish to verify answers.
// =====================================================================

export const AGENT = {
  displayName: 'FitCheck',
  description: 'Fit Check: a rule-based assistant that helps college students decide whether an EV (Tesla Model 3 / Model Y) fits their life and budget.',
  timezone: 'America/Indiana/Indianapolis',
};

// ---------------------------------------------------------------- sources
export const SOURCES = {
  dot: {
    title: 'Charger Types and Speeds - U.S. Department of Transportation',
    url: 'https://www.transportation.gov/rural/ev/toolkit/ev-basics/charging-speeds',
    excerpt: 'Level 1 (120 V AC, home) adds about 2-5 miles of range per hour of charging. Level 2 (208-240 V AC; home, workplace and public) adds about 10-20 miles per hour. DC fast charging (public) adds about 180-240 miles per hour and reaches 80% in about 20 minutes to 1 hour.',
  },
  feg: {
    title: 'Charging Your Plug-in Electric Car - FuelEconomy.gov',
    url: 'https://fueleconomy.gov/feg/charging.shtml',
    excerpt: 'A Level 2 home charging unit generally costs about $400 to $1,000 plus installation, which varies with the electrician, the job and permits. Some public chargers are free; others charge per session, per kWh, by time, or by subscription, and rates vary by region and network.',
  },
  afdcHome: {
    title: 'Charging Electric Vehicles at Home - U.S. Department of Energy AFDC',
    url: 'https://afdc.energy.gov/fuels/electricity-charging-home',
    excerpt: 'Most EV drivers charge overnight at home with Level 1 or Level 2 equipment. Example: if electricity costs 10.7 cents per kWh and the vehicle uses 27 kWh to travel 100 miles, the cost is about $0.03 per mile.',
  },
  aaa: {
    title: 'AAA study: EVs lose range in cold and hot weather (2026) - InsideEVs',
    url: 'https://insideevs.com/news/794917/ev-hybrid-efficiency-range-drop-cold/',
    excerpt: 'In AAA testing at a constant 20°F with climate control at 72°F, the three EVs tested (including a 2025 Tesla Model Y) averaged a 35.6% efficiency drop and a 39% loss in calculated range. Driving an EV 1,000 miles cost about $55.64 at moderate temperatures and $87.75 at 20°F at home charging rates.',
  },
  taxCredit: {
    title: 'How the EV Tax Credit Works - Kiplinger',
    url: 'https://www.kiplinger.com/taxes/ev-tax-credit-gets-complicated',
    excerpt: 'The federal clean-vehicle tax credit, worth up to $7,500 for new EVs and $4,000 for used EVs, expired for vehicles purchased or leased after September 30, 2025.',
  },
  chargerCredit: {
    title: 'Federal EV Tax Credits Have Ended - EVlife',
    url: 'https://help.evlife.co/en/articles/8500995-federal-ev-tax-credits-have-ended-as-of-september-30-2025',
    excerpt: 'Federal tax credits for new and used EVs ended September 30, 2025. The federal credit for home EV charging equipment remained available only through June 30, 2026.',
  },
  prices: {
    title: 'Tesla Model 3 and Model Y Standard prices - Deseret News',
    url: 'https://www.deseret.com/business/2025/10/08/elon-musk-donald-trump-tesla-electric-vehicle-price-cuts-tax-credit-ev',
    excerpt: 'Tesla launched the Model Y Standard at $39,990, $5,000 less than the Model Y Premium ($44,990), and the Model 3 Standard at $36,990, $5,500 less than the Model 3 Premium ($42,490).',
  },
  pricesWithFees: {
    title: 'Standard Model Y and Model 3: all the features Tesla cut - InsideEVs',
    url: 'https://insideevs.com/news/775109/tesla-model-y-standard-model-3-standard-gutted-features/',
    excerpt: 'The Model 3 Standard costs $38,630 including fees, $5,500 less than the next trim, the Premium Rear-Wheel Drive. It is one of the cheapest new Tesla models ever.',
  },
  range: {
    title: "Tesla's new Standard models - Kelley Blue Book",
    url: 'https://www.kbb.com/car-news/teslas-new-standard-models-lower-prices-fewer-features',
    excerpt: 'The Model Y Standard achieves up to 321 miles of range, down from 357 in the Premium. The Model 3 Standard also travels up to 321 miles, down from 363 in the Premium version.',
  },
  standardCuts: {
    title: 'Tesla Model 3 and Model Y Standard - Carscoops',
    url: 'https://www.carscoops.com/?p=3296153',
    excerpt: 'Tesla introduced Standard trims of the Model 3 and Model Y; Autosteer and AM/FM radio are gone and shock absorbers are downgraded. The former Long Range models were renamed Premium.',
  },
  warranty: {
    title: 'Vehicle Warranty - Tesla',
    url: 'https://www.tesla.com/support/vehicle-warranty-M3',
    excerpt: 'Battery and Drive Unit Limited Warranty: Model 3 RWD, Model Y RWD and Model Y AWD are covered for 8 years or 100,000 miles; Model 3 and Model Y Premium and Performance trims for 8 years or 120,000 miles, with minimum 70% retention of battery capacity over the warranty period.',
  },
  usedWarranty: {
    title: 'Used Vehicle Limited Warranty - Tesla',
    url: 'https://digitalassets.tesla.com/tesla-contents/image/upload/tesla-used-vehicle-limited-warranty-en-us.pdf',
    excerpt: 'Tesla used vehicles are covered by the Used Vehicle Limited Warranty for 1 year or 10,000 miles, starting when the original 4-year/50,000-mile Basic Vehicle Limited Warranty expires, or at delivery if it has already expired.',
  },
  maintenance: {
    title: 'Quick Facts About Tesla Maintenance - Kelley Blue Book',
    url: 'https://www.kbb.com/car-advice/maintaining-your-tesla',
    excerpt: 'Replace the cabin air filter every 2 years (Model 3, Model Y), rotate tires every 6,250 miles, and test brake fluid every 4 years. Tesla mobile service can come to where the car is parked for routine maintenance.',
  },
  demoDrive: {
    title: 'Demo Drive - Tesla Support',
    url: 'https://www.tesla.com/support/test-drive',
    excerpt: 'Schedule a demo drive online. Standard demo drives of Model 3 and Model Y require age 18 and a valid license; overnight and self-serve demo drives require age 21. Arrive about 10 minutes early, and the email used to book must match your Tesla app login. When using FSD (Supervised), drivers must remain attentive.',
  },
  iu: {
    title: 'Electric Vehicle Charging - IU Parking Operations',
    url: 'https://parking.indiana.edu/facilities/electrc-vehicle-charging.html',
    excerpt: 'University parking permit holders with an EV can buy a supplemental EVC permit at the permit office. Visitors may charge at garage stations and pay the hourly parking rate. Vehicles must be actively charging to park in an EVC space, and charging is limited to 4 hours a day. Stations include the Atwater, East (upper level), Fee Lane, Henderson and Forrest Avenue garages.',
  },
  insurance: {
    title: 'EV Insurance Discounts - AutoInsurance.com',
    url: 'https://www.autoinsurance.com/articles/ev-insurance-discounts',
    excerpt: 'Common discounts for EV drivers include bundling, good driver, new vehicle, and good student. Good student discounts are available from most insurers for full-time students with a good academic record, usually at least a B average.',
  },
  insuranceTesla: {
    title: 'How much does electric car insurance cost - CarInsurance.com',
    url: 'https://carinsurance.com/how-much-does-electric-car-insurance-cost',
    excerpt: 'The cost to insure Tesla vehicles is higher than for other EVs or hybrids. Major carriers offer EV insurance, and discounts for good drivers, safe vehicles and students apply regardless of fuel type.',
  },
};

// ---------------------------------------------------------------- helpers
const MENU_CHIPS = ['Take the Fit Check quiz', 'How much does a Tesla cost?', 'Where would I charge?', 'Book a test drive'];
const AFTER_QUIZ_CHIPS = ['Book a test drive', 'Insurance tips', 'Financing with no credit', 'Retake the quiz'];

const QUIZ_CONTEXTS = [
  'quiz-q1', 'quiz-q2-home', 'quiz-q2-public',
  'quiz-q3-home-used', 'quiz-q3-home-new', 'quiz-q3-public-used', 'quiz-q3-public-new',
];
const clearOthers = (keep = []) => QUIZ_CONTEXTS.filter((c) => !keep.includes(c)).map((name) => ({ name, lifespan: 0 }));

function faq(name, phrases, messages, { suggestions = [], sources = [], action = '' } = {}) {
  return { name, phrases, messages: [].concat(messages), suggestions, sources, action, inputContexts: [], outputContexts: [] };
}

// ---------------------------------------------------------------- general intents
const general = [
  {
    name: 'Default Welcome Intent',
    action: 'input.welcome',
    events: ['WELCOME'],
    phrases: ['hi', 'hello', 'hey', 'hey there', 'hi fit check', 'good morning', 'good evening', "what's up", 'yo', 'start', 'get started', 'hello, I need help buying a car', 'hi, I want an electric car'],
    messages: [
      "Hey! I'm Fit Check. I help college students figure out if an electric car fits their life and budget, with a focus on Tesla's Model 3 and Model Y.",
      'You can take the 3-question Fit Check quiz, or ask me about costs, charging, range, insurance, financing, used Teslas, or booking a test drive. What sounds good?',
    ],
    suggestions: MENU_CHIPS,
    polish: false,
    inputContexts: [],
    outputContexts: clearOthers(),
  },
  {
    name: 'Default Fallback Intent',
    action: 'input.unknown',
    fallback: true,
    phrases: [],
    messages: [
      "Sorry, I didn't catch that. I work best with these topics: the Fit Check quiz, costs, charging, range, insurance, financing, used Teslas, or test drives. Try one of those, or type \"menu\".",
    ],
    suggestions: MENU_CHIPS,
    inputContexts: [],
    outputContexts: [],
  },
  faq('menu.help', ['menu', 'help', 'main menu', 'what can you do', 'what can I ask you', 'options', 'show me the options', 'what do you know about', 'topics', 'how does this work', 'what are you', 'list topics'], [
    'Here is what I can help with:\n- The Fit Check quiz (3 questions, personalized pick)\n- Costs, tax credits, and charging vs. gas\n- Charging at home, in an apartment or dorm, or on campus\n- Range, road trips, and winter driving',
    '- Model 3 vs. Model Y, buying used, and the battery warranty\n- Insurance, financing with little credit, and maintenance\n- Booking a demo drive and how ordering works\nWhat do you want to start with?',
  ], { suggestions: MENU_CHIPS }),
  faq('smalltalk.thanks_bye', ['thanks', 'thank you', 'thanks so much', 'that helps', 'bye', 'goodbye', 'see you', "that's all", "I'm done", 'cool thanks', 'appreciate it', 'perfect, thanks'], [
    'Anytime! Good luck with your first EV. Type "menu" whenever you want to pick things back up.',
  ]),
  faq('human.handoff', ['talk to a person', 'talk to a human', 'real person', 'can I speak to someone', 'customer service', 'contact Tesla', 'I want to talk to an agent', 'speak to a representative', 'call someone', 'are you a bot'], [
    "I'm an automated, rule-based assistant, so I can't connect you to a person directly. For questions about a specific car or order, reach a Tesla Advisor through tesla.com/support, or book a demo drive and ask an advisor in person.",
  ], { suggestions: ['Book a test drive', 'menu'] }),
];

// ---------------------------------------------------------------- customer-journey FAQ
const journey = [
  // ---- Awareness
  faq('ev.why', ['should I get an EV', 'why buy an electric car', 'is an electric car worth it', 'pros and cons of EVs', 'are EVs good for college students', 'why should I go electric', 'is a Tesla worth it for a student', 'benefits of an electric car', 'downsides of electric cars', 'EV vs gas car', 'should I buy electric or gas'], [
    "Here's the honest version for students.\nPros: charging at home costs far less per mile than gas, there are no oil changes, and EVs are quick and quiet.\nCons: the upfront price is higher than a cheap used gas car, insurance often costs more, and cold weather cuts range.",
    'The biggest deciding factor is whether you can plug in where you live. Want to take the Fit Check quiz to see if an EV works for you?',
  ], { suggestions: ['Take the Fit Check quiz', 'How much does a Tesla cost?'], sources: ['afdcHome', 'insuranceTesla', 'aaa'] }),

  faq('cost.overview', ['how much does a Tesla cost', 'how much is a Tesla', 'price of a Model 3', 'how expensive is an EV', 'what is the cheapest Tesla', 'can I afford a Tesla', 'Tesla price', 'cost of an electric car', 'how much is a Model Y', 'cheapest electric car', 'is a Tesla affordable', 'what does an EV cost'], [
    "For the 2026 model year, Tesla's cheapest new cars are the Standard trims. The Model 3 Standard launched at $36,990 and the Model Y Standard at $39,990, before fees. With fees, the Model 3 Standard came to about $38,630. Prices change often, so check tesla.com for today's number.",
    'The federal EV tax credit has ended, so on a tighter budget a used Model 3 is usually the best value. Want tips on buying used or on financing?',
  ], { suggestions: ['Buying a used Tesla', 'Financing with no credit', 'Is there a tax credit?'], sources: ['prices', 'pricesWithFees', 'taxCredit'] }),

  faq('cost.tax_credit', ['is there a tax credit', 'EV tax credit', 'can I get $7,500 back', 'federal tax credit for electric cars', 'are there any rebates', 'EV incentives', 'used EV tax credit', 'government incentive for EVs', 'do I get money back for buying an EV', 'tax credit for home charger'], [
    "Unfortunately, no. The federal EV tax credit (up to $7,500 new, $4,000 used) ended for cars bought after September 30, 2025, and the federal credit for home chargers ran only through June 30, 2026.",
    "Some states, cities, and electric utilities still offer their own rebates, so check with your electric utility and the Department of Energy's incentive search at afdc.energy.gov/laws before you buy.",
  ], { suggestions: ['How much does a Tesla cost?', 'Charging vs. gas cost'], sources: ['taxCredit', 'chargerCredit'] }),

  faq('cost.charging_vs_gas', ['is charging cheaper than gas', 'how much does it cost to charge', 'charging vs gas cost', 'how much will I save on gas', 'cost per mile of an EV', 'electricity cost to charge a Tesla', 'is it cheaper to run an EV', 'how much does charging add to my electric bill', 'fuel savings', 'how much does a full charge cost'], [
    "Charging at home is usually the cheapest way to fuel any car. The Department of Energy's example: at 10.7 cents per kWh and 27 kWh per 100 miles, an EV costs about 3 cents per mile. Your electric rate may be higher, so plug in your own rate.",
    "AAA's 2026 testing found home-charged EVs cost about $56 per 1,000 miles in mild weather and about $88 at 20°F. Public fast charging costs more than charging at home, so where you charge matters most.",
  ], { suggestions: ['Where would I charge?', 'Winter range'], sources: ['afdcHome', 'aaa', 'feg'] }),

  // ---- Consideration: charging
  faq('charging.basics', ['where would I charge', 'how does charging work', 'how do I charge an EV', 'what are Level 1 and Level 2', 'how long does it take to charge', 'charging speeds', 'can I plug into a normal outlet', 'do I need a special charger', 'how fast does a Tesla charge', 'what is a Level 2 charger', 'charging options'], [
    'There are three ways to charge (U.S. DOT figures):\n- Level 1, a regular 120V outlet: about 2-5 miles of range per hour. Slow, but overnight it covers a lot of campus driving.\n- Level 2, a 240V charger (like a dryer outlet): about 10-20 miles per hour. Found at homes, workplaces, and public lots.',
    "- DC fast charging, like Tesla Superchargers: about 180-240 miles per hour, for road trips.\nA home Level 2 unit usually costs about $400 to $1,000 plus installation. Where do you live: a house, an apartment, or a dorm?",
  ], { suggestions: ['I live in an apartment or dorm', 'Charging on campus', 'Road trips'], sources: ['dot', 'feg'] }),

  faq('charging.no_home', ['I live in an apartment', 'I live in a dorm', 'I live in an apartment or dorm', "I don't have a garage", 'can I own an EV without home charging', 'no place to charge at home', 'apartment charging', 'how do I charge if I rent', 'street parking only', 'my landlord does not have chargers', 'can I charge in a dorm'], [
    "You can still own an EV without a garage, it just takes planning:\n1. Ask your landlord or complex if there's an outlet or charger you can use. Even a regular 120V outlet helps.\n2. Check your campus parking office for EV charging spaces.",
    '3. Use public Level 2 chargers while you are in class, at the gym, or shopping.\n4. Use Superchargers for quick top-ups, but they cost more than charging at home.\nWant info on charging on campus?',
  ], { suggestions: ['Charging on campus', 'Charging vs. gas cost', 'Take the Fit Check quiz'], sources: ['dot', 'feg'] }),

  faq('charging.campus', ['charging on campus', 'can I charge at school', 'does IU have chargers', 'campus EV charging', 'where can I charge at Indiana University', 'are there chargers in the parking garage', 'EV parking permit', 'charging at college', 'IU charging stations', 'can students charge on campus'], [
    'Most campuses have some EV charging, usually in parking garages and tied to a parking permit. At IU Bloomington, for example, chargers are in the Atwater, East (upper level), Fee Lane, Henderson, and Forrest Avenue garages.',
    "IU's rules: university permit holders can buy a supplemental EV charging permit at the parking office, visitors pay the hourly garage rate, cars must be actively charging, and charging is limited to 4 hours a day. At other schools, check your parking services website for the same details.",
  ], { suggestions: ['Road trips', 'Take the Fit Check quiz'], sources: ['iu'] }),

  faq('charging.road_trip', ['road trips', 'road trip', 'can I drive home on breaks', 'long distance driving', 'what is a Supercharger', 'fast charging', 'Supercharger', 'how do road trips work in a Tesla', 'driving to another state', 'charging on the highway', 'can I drive 300 miles'], [
    "Road trips are where Tesla's Supercharger network helps. DC fast charging adds roughly 180-240 miles of range per hour, and the U.S. DOT puts a fast charge to 80% at about 20 minutes to an hour. Tesla's navigation can plan charging stops along your route.",
    'Tips: leave with a full charge from home, plan an extra stop in winter, and expect to pay more per mile than charging at home.',
  ], { suggestions: ['How far can I drive?', 'Winter range'], sources: ['dot', 'feg'] }),

  // ---- Consideration: range
  faq('range.basics', ['how far can I drive', 'how far can I drive on one charge', 'what is the range', 'range of a Model 3', 'how many miles per charge', 'range of a Model Y', 'will I run out of battery', 'range anxiety', 'how long does the battery last per charge', 'miles on a full charge'], [
    'For the 2026 model year, the Model 3 Standard and Model Y Standard are EPA-rated at up to 321 miles. The Premium versions go further: up to 363 miles for the Model 3 and 357 for the Model Y.',
    'Most students drive far less than that in a day, so range mostly matters for road trips and cold weather. Want to know how winter affects range?',
  ], { suggestions: ['Winter range', 'Road trips', 'Model 3 vs Model Y'], sources: ['range'] }),

  faq('range.winter', ['winter range', 'does cold weather affect range', 'how do EVs do in winter', 'Indiana winters', 'snow and electric cars', 'range in the cold', 'does the battery drain in winter', 'cold weather', 'EVs in snow', 'winter driving tips'], [
    "Cold weather is the biggest range hit. In AAA's 2026 testing at 20°F with the heat set to 72°F, the EVs tested lost about 39% of their range on average. A car rated for 321 miles might go roughly 200 in a deep freeze.",
    'Tips: warm the car up while it is still plugged in, use seat heaters instead of blasting cabin heat, and keep a bigger buffer on winter road trips.',
  ], { suggestions: ['Road trips', 'Take the Fit Check quiz'], sources: ['aaa', 'range'] }),

  // ---- Consideration: models, used, warranty
  faq('models.compare', ['Model 3 vs Model Y', 'which Tesla should I get', 'difference between Model 3 and Model Y', 'Model 3 or Model Y', 'which model is best for a student', 'compare Tesla models', 'what is the Standard trim', 'Standard vs Premium', 'tell me about the Model 3', 'tell me about the Model Y', 'which Tesla is cheapest'], [
    'Quick comparison (2026 model year, launch prices before fees):\n- Model 3 Standard: sedan, $36,990, up to 321 miles. The cheapest new Tesla.\n- Model Y Standard: small SUV, $39,990, up to 321 miles. More cargo room for moving in and out of dorms.',
    '- Premium trims cost $5,000 to $5,500 more and add range and features.\nFor most students, the Model 3 Standard is the best new value, and a used Model 3 is cheaper still.',
  ], { suggestions: ['Buying a used Tesla', 'Take the Fit Check quiz', 'Book a test drive'], sources: ['prices', 'range'] }),

  faq('buy.used', ['buying a used Tesla', 'should I buy used', 'used Tesla', 'used Model 3', 'is a used EV a good idea', 'where can I buy a used Tesla', 'certified pre-owned Tesla', 'used electric car', 'what to check on a used EV', 'used Tesla warranty'], [
    'Buying used is the best value for most students, and Tesla sells used cars on tesla.com. Buy from Tesla and you get whatever is left of the original 4-year/50,000-mile basic warranty, then a 1-year/10,000-mile used vehicle warranty. The 8-year battery and drive unit warranty also stays with the car.',
    'Before you buy, check how much battery warranty is left, look at the vehicle history, and test drive it. Want details on the battery warranty?',
  ], { suggestions: ['Battery warranty', 'Financing with no credit', 'Book a test drive'], sources: ['usedWarranty', 'warranty'] }),

  faq('battery.warranty', ['battery warranty', 'how long does the battery last', 'battery degradation', 'what if the battery dies', 'Tesla warranty', 'is the battery covered', 'battery replacement', 'how many years is the battery warranty', 'does the battery wear out', 'drive unit warranty'], [
    "Tesla's battery and drive unit warranty lasts 8 years. The mileage limit is 100,000 miles for the Model 3 RWD (including the Standard) and the Model Y RWD and AWD, and 120,000 miles for Premium and Performance trims.",
    'Tesla guarantees at least 70% of battery capacity over that period, and the coverage stays with the car if you buy used.',
  ], { suggestions: ['Buying a used Tesla', 'Maintenance'], sources: ['warranty'] }),

  // ---- Consideration: money
  faq('insurance.tips', ['insurance tips', 'how much is insurance for a Tesla', 'is EV insurance expensive', 'insurance for college students', 'how do I lower my insurance', 'car insurance', 'student insurance discount', 'is a Tesla expensive to insure', 'insurance for young drivers', 'good student discount'], [
    'EVs, and Teslas especially, often cost more to insure than comparable gas cars, and young drivers already pay more. Ways to keep it down:\n- Get quotes for the exact model and trim before you buy.\n- Ask about a good-student discount (usually for a B average or better).',
    "- See if you can stay on a parent's policy.\n- Ask about safe-driving (telematics) programs and bundling.\n- Compare a higher deductible against the savings.",
  ], { suggestions: ['Financing with no credit', 'How much does a Tesla cost?'], sources: ['insurance', 'insuranceTesla'] }),

  faq('financing.no_credit', ['financing with no credit', 'can I get a car loan as a student', 'I have no credit', 'how do I finance a Tesla', 'should I lease or buy', 'car loan', 'leasing a Tesla', 'monthly payment', 'do I need a cosigner', 'how to pay for a car in college', 'low credit score car loan'], [
    'Thin credit is normal in college. Your options:\n- Get pre-approved at a credit union first so you have a rate to compare.\n- Apply with a co-signer, like a parent, to qualify for a better rate.\n- Tesla lets you apply for a loan or lease when you order, so compare its offer with your pre-approval.',
    "- Leasing usually means a lower monthly payment, but you don't own the car and there are mileage limits.\nTip: budget for insurance and charging, not just the monthly payment.",
  ], { suggestions: ['Insurance tips', 'How does ordering work?'] }),

  faq('maintenance.basics', ['maintenance', 'what maintenance does a Tesla need', 'do EVs need oil changes', 'how often do I service a Tesla', 'maintenance cost', 'tire rotation', 'where do I get it serviced', 'Tesla service', 'is an EV cheaper to maintain', 'repairs'], [
    'EVs need a lot less maintenance: no oil changes, spark plugs, or transmission fluid. For the Model 3 and Model Y, the recommended schedule includes tire rotations every 6,250 miles, a new cabin air filter every 2 years, and a brake fluid check every 4 years.',
    "You schedule service in the Tesla app, and Tesla's mobile service can do many jobs wherever your car is parked.",
  ], { suggestions: ['Battery warranty', 'Book a test drive'], sources: ['maintenance'] }),

  // ---- Purchase
  faq('testdrive.book', ['book a test drive', 'test drive', 'demo drive', 'can I test drive a Tesla', 'schedule a test drive', 'how old do I have to be to test drive', 'where can I drive a Tesla', 'I want to try one', 'self-serve demo drive', 'test drive age requirement'], [
    "Book a demo drive at tesla.com/drive. Good to know for college students:\n- A regular demo drive of a Model 3 or Model Y requires you to be 18 or older with a valid driver's license.\n- Overnight and self-serve demo drives require you to be 21 or older.",
    '- Arrive about 10 minutes early, and book with the same email as your Tesla app login.\nTip: ask the advisor how charging would work at your apartment or campus.',
  ], { suggestions: ['How does ordering work?', 'Insurance tips'], sources: ['demoDrive'] }),

  faq('buy.process', ['how does ordering work', 'how do I buy a Tesla', 'how to order a Tesla', 'buying process', 'what happens after I order', 'delivery', 'are there extra fees', 'how do I purchase', 'do I go to a dealership', 'next steps to buy'], [
    'Buying a Tesla happens online:\n1. Pick a model and trim on tesla.com and place your order.\n2. Choose cash, a loan, or a lease. You can also bring your own lender.\n3. Set up insurance before delivery.\n4. Take delivery and finish setup in the Tesla app.',
    'The advertised price does not include fees. At launch, the Model 3 Standard went from $36,990 to about $38,630 with fees.',
  ], { suggestions: ['Financing with no credit', 'Insurance tips', 'Book a test drive'], sources: ['prices', 'pricesWithFees'] }),

  faq('fsd.autopilot', ['does a Tesla drive itself', 'self driving', 'Full Self-Driving', 'what is FSD', 'Autopilot', 'is Autopilot included', 'can the car drive for me', 'is FSD worth it', 'autonomous driving', 'does the Standard have Autosteer'], [
    "Teslas offer driver-assistance features, but none of them drive themselves. Full Self-Driving (Supervised) is an optional extra and still requires you to pay attention and be ready to take over at all times.",
    'Note that the 2026 Standard trims dropped Autosteer, so check exactly what a trim includes before you buy. On a student budget, this is an easy thing to skip.',
  ], { suggestions: ['Model 3 vs Model Y', 'How much does a Tesla cost?'], sources: ['demoDrive', 'standardCuts'] }),
];

// ---------------------------------------------------------------- the Fit Check quiz (decision tree)
const Q1 = 'Question 1 of 3: Where would you charge most nights?\nA) At home or my apartment, where I can plug in\nB) Only campus or public chargers';
const Q2 = "Question 2 of 3: What's your budget?\nA) Under $35,000, used is fine\nB) $35,000 or more for a new car";
const Q3 = 'Question 3 of 3: How do you usually drive?\nA) Mostly around campus and town\nB) Regular long trips, like driving home on breaks';
const Q1_CHIPS = ['I can charge at home', 'Only campus or public chargers'];
const Q2_CHIPS = ['Under $35,000, used is fine', '$35,000 or more, new'];
const Q3_CHIPS = ['Mostly around campus', 'Long trips home'];

const P = {
  q1home: ['A', 'option A', 'I can charge at home', 'at home', 'home', 'I have a garage', 'I have a driveway', 'my apartment has a charger', "there's an outlet I can use", 'I can plug in where I live', 'my parking spot has an outlet', 'I live in a house', 'yes I can plug in at home'],
  q1public: ['B', 'option B', 'only campus or public chargers', 'public chargers', 'campus chargers', "I can't charge at home", 'no garage', 'no outlet', 'I live in a dorm', 'my apartment does not have charging', 'street parking', "no I can't plug in", 'only public'],
  used: ['A', 'option A', 'under $35,000, used is fine', 'under 35k', 'used is fine', 'used', 'a used car', 'cheap', 'tight budget', 'less than 30k', 'around 25 thousand', 'as cheap as possible', "I'm on a budget"],
  new: ['B', 'option B', '$35,000 or more, new', '35k or more', 'new', 'a new car', 'brand new', '40k', 'I can afford a new one', 'more than 35 thousand', 'I want a new car', "budget isn't a problem"],
  local: ['A', 'option A', 'mostly around campus', 'around town', 'short trips', 'local', "I don't drive far", 'just around campus', 'driving to class', 'a few miles a day', 'mostly local driving', 'not much'],
  trips: ['B', 'option B', 'long trips home', 'long trips', 'road trips', 'I drive home on breaks', 'regular long trips', 'I drive a lot', 'highway driving', 'weekend trips', 'I go home every few weeks', 'more than 2 hours'],
};

const quizStart = {
  name: 'quiz.start',
  phrases: ['take the Fit Check quiz', 'start the quiz', 'quiz', 'fit check', 'is an EV right for me', 'is a Tesla right for me', 'which Tesla fits me', 'help me decide', 'retake the quiz', 'restart the quiz', 'start over', 'give me a recommendation', 'what should I buy'],
  messages: ["Let's do it: 3 quick questions, and I'll give you a Fit Check result.", Q1],
  suggestions: Q1_CHIPS,
  polish: false,
  inputContexts: [],
  outputContexts: [{ name: 'quiz-q1', lifespan: 2 }, ...clearOthers(['quiz-q1'])],
};

function step(name, input, phrases, messages, next, chips) {
  return {
    name,
    phrases,
    messages,
    suggestions: chips,
    polish: false,
    inputContexts: [input],
    outputContexts: [{ name: next, lifespan: 2 }, ...clearOthers([next])],
  };
}

function reask(name, input, question, chips) {
  return {
    name,
    fallback: true,
    phrases: [],
    messages: ["I didn't catch that answer. Pick A or B, or type \"menu\" to leave the quiz.", question],
    suggestions: chips,
    polish: false,
    inputContexts: [input],
    outputContexts: [{ name: input, lifespan: 2 }],
  };
}

// Leaf results: the rules. Charging access matters most, then driving pattern, then budget.
const RESULTS = {
  'home-used-local': [
    'Your Fit Check result: GREAT FIT.\nMy pick: a used Model 3 from Tesla\'s used inventory.',
    "Why: you can plug in at home and you mostly drive locally, so even a regular 120V outlet (about 2-5 miles of range per hour) can refill a normal day of campus driving overnight. Buying used keeps the price down, and the 8-year battery warranty stays with the car.\nNext steps: check how much battery warranty is left, get an insurance quote, and book a demo drive.",
  ],
  'home-used-trips': [
    'Your Fit Check result: GREAT FIT.\nMy pick: a used Model 3 Long Range (the trim Tesla now calls Premium), for extra range on trips home.',
    'Why: you can charge cheaply at home during the week and use Superchargers on the highway, which add roughly 180-240 miles of range per hour. Cold weather can cut range a lot, so plan an extra stop on winter trips.\nNext steps: compare used listings by remaining battery warranty, get an insurance quote, and book a demo drive.',
  ],
  'home-new-local': [
    'Your Fit Check result: GREAT FIT.\nMy pick: a new Model 3 Standard, the cheapest new Tesla (launched at $36,990 before fees, EPA-rated up to 321 miles for 2026).',
    "Why: you can plug in at home and you drive locally, so a regular outlet is enough to start and a Level 2 charger is optional. A new car comes with Tesla's full warranty.\nNext steps: get an insurance quote, compare financing with a credit union, and book a demo drive.",
  ],
  'home-new-trips': [
    'Your Fit Check result: GREAT FIT.\nMy pick: a new Model 3 Premium for the most range (up to 363 miles for 2026), or a Model Y if you need SUV cargo space for moving in and out.',
    "Why: home charging covers the week, and Superchargers make trips home easy. If you can install a Level 2 charger (about 10-20 miles of range per hour), you'll leave every trip with a full battery.\nNext steps: get an insurance quote, compare financing, and book a demo drive.",
  ],
  'public-used-local': [
    'Your Fit Check result: GOOD FIT, WITH PLANNING.\nMy pick: a used Model 3.',
    'Why: local driving uses little energy, so a couple of charging sessions a week at campus garages or public Level 2 chargers may cover you. Public charging costs more than home charging and comes with rules (IU garages, for example, limit charging to 4 hours a day). First, ask your landlord about an outlet, because it changes everything.\nNext steps: map the chargers near you, then book a demo drive.',
  ],
  'public-used-trips': [
    'Your Fit Check result: RISKY FIT RIGHT NOW.\nLong trips plus no home charging means paying for fast charging often and planning your life around chargers.',
    "My advice: consider waiting until you live somewhere you can plug in. If you still want a Tesla now, look at a used Model 3 Long Range (now called Premium) and make sure there's a Supercharger close to campus.\nNext steps: check chargers near you and get an insurance quote before you commit.",
  ],
  'public-new-local': [
    'Your Fit Check result: GOOD FIT, WITH PLANNING.\nMy pick: a new Model 3 Standard (launched at $36,990 before fees).',
    "Why: local driving is easy to cover with a couple of charging sessions a week on campus or at public chargers, but you'll pay public rates and follow time limits. Since you're paying new-car prices, ask your landlord about an outlet before you buy.\nNext steps: map the chargers near you, get an insurance quote, and book a demo drive.",
  ],
  'public-new-trips': [
    'Your Fit Check result: RISKY FIT RIGHT NOW.\nA new car with no home charging and frequent long trips means a lot of paid fast charging.',
    "My advice: if you buy anyway, the Model 3 Premium gives you the most range (up to 363 miles for 2026). Make sure there's a Supercharger near you, and budget extra for charging. Otherwise, waiting until you can charge at home makes an EV much easier.\nNext steps: check chargers near you and get an insurance quote.",
  ],
};
const RESULT_SOURCES = {
  'home-used-local': ['dot', 'warranty', 'usedWarranty'],
  'home-used-trips': ['dot', 'aaa', 'standardCuts'],
  'home-new-local': ['prices', 'range', 'dot'],
  'home-new-trips': ['range', 'dot'],
  'public-used-local': ['iu', 'feg'],
  'public-used-trips': ['dot', 'feg', 'standardCuts'],
  'public-new-local': ['prices', 'feg'],
  'public-new-trips': ['range', 'feg'],
};

const quiz = [quizStart];
quiz.push(reask('quiz.q1.fallback', 'quiz-q1', Q1, Q1_CHIPS));
quiz.push(step('quiz.q1.home', 'quiz-q1', P.q1home,
  ['Nice. Being able to plug in at home is the single biggest thing that makes an EV easy.', Q2], 'quiz-q2-home', Q2_CHIPS));
quiz.push(step('quiz.q1.public', 'quiz-q1', P.q1public,
  ["Got it. Without home charging you'll plan charging the way you plan gas stops, and pay public rates. It's still doable for a lot of students.", Q2], 'quiz-q2-public', Q2_CHIPS));

for (const where of ['home', 'public']) {
  const ctx = `quiz-q2-${where}`;
  quiz.push(reask(`quiz.q2.${where}.fallback`, ctx, Q2, Q2_CHIPS));
  quiz.push(step(`quiz.q2.${where}.used`, ctx, P.used,
    ["Used is the smart money move for most students, and buying from Tesla adds extra warranty coverage.", Q3], `quiz-q3-${where}-used`, Q3_CHIPS));
  quiz.push(step(`quiz.q2.${where}.new`, ctx, P.new,
    ['New gets you the full warranty and the latest features.', Q3], `quiz-q3-${where}-new`, Q3_CHIPS));

  for (const budget of ['used', 'new']) {
    const ctx3 = `quiz-q3-${where}-${budget}`;
    quiz.push(reask(`quiz.q3.${where}.${budget}.fallback`, ctx3, Q3, Q3_CHIPS));
    for (const drive of ['local', 'trips']) {
      const key = `${where}-${budget}-${drive}`;
      quiz.push({
        name: `quiz.result.${key}`,
        phrases: P[drive],
        messages: RESULTS[key],
        suggestions: AFTER_QUIZ_CHIPS,
        sources: RESULT_SOURCES[key],
        inputContexts: [ctx3],
        outputContexts: clearOthers(),
      });
    }
  }
}

export const INTENTS = [...general, ...journey, ...quiz].map((i) => ({
  events: [], fallback: false, action: '', sources: [], suggestions: [], polish: true, ...i,
}));

// Custom payload Dialogflow returns with each reply (quick-reply buttons + polish switch).
export function payloadFor(i) {
  const p = {};
  if (i.suggestions.length) p.suggestions = i.suggestions;
  if (i.polish === false) p.polish = false;
  return Object.keys(p).length ? p : null;
}

// Map of intent name -> source objects, used by the website's verification step.
export const SOURCE_MAP = Object.fromEntries(
  INTENTS.filter((i) => i.sources.length).map((i) => [i.name, i.sources.map((k) => SOURCES[k])])
);
