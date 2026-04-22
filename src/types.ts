export type ServiceType = 'scheduled' | 'rsa';

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  type: ServiceType;
  vehicleType?: 'Car' | 'Bike' | 'Both';
  category?: string;
}

export interface Job {
  id: string;
  customerName: string;
  serviceName: string;
  location: string;
  vehicle: string;
  eta: string;
  status: 'pending' | 'accepted' | 'en-route' | 'live' | 'completed' | 'declined';
  type: ServiceType;
  partner?: string;
  partnerUid?: string;
  customerUid: string;
  fee: number;
  urgent?: boolean;
}

export type UserRole = 'customer' | 'partner' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
}

export interface Partner {
  id: string;
  uid?: string;
  name: string;
  types: string[];
  location: string;
  status: 'online' | 'busy' | 'offline' | 'pending_verification';
  initials: string;
  owner?: string;
  phone?: string;
  email?: string;
  timing?: string;
  typeDesc?: string;
  services?: { serviceId: string; price: number }[];
  documents?: {
    license: string;
    idProof: string;
    garagePhoto: string;
  };
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  category: string;
}

export const SERVICES: Service[] = [
  // --- CAR: Scheduled Maintenance ---
  { id: 'c-ps', name: 'Periodic Service', description: 'Comprehensive car maintenance', price: 2500, type: 'scheduled', vehicleType: 'Car', category: 'Maintenance' },
  { id: 'c-oc', name: 'Engine Oil Change', description: 'Premium oil replacement', price: 1200, type: 'scheduled', vehicleType: 'Car', category: 'Maintenance' },
  { id: 'c-of', name: 'Oil Filter Replacement', description: 'Genuine filter swap', price: 400, type: 'scheduled', vehicleType: 'Car', category: 'Maintenance' },
  { id: 'c-af', name: 'Air Filter Check/Replacement', description: 'Air flow optimization', price: 350, type: 'scheduled', vehicleType: 'Car', category: 'Maintenance' },
  { id: 'c-bh', name: 'Battery Health Check', description: 'Voltage & cell inspection', price: 150, type: 'scheduled', vehicleType: 'Car', category: 'Maintenance' },
  { id: 'c-bi', name: 'Brake Inspection', description: 'Pad & rotor safety check', price: 300, type: 'scheduled', vehicleType: 'Car', category: 'Maintenance' },
  { id: 'c-tr', name: 'Tyre Rotation / Check', description: 'Wear pattern & pressure check', price: 250, type: 'scheduled', vehicleType: 'Car', category: 'Maintenance' },
  { id: 'c-ft', name: 'Fluid Top-up / Basic Inspection', description: 'Coolant, wipers, brakes', price: 500, type: 'scheduled', vehicleType: 'Car', category: 'Maintenance' },
  { id: 'c-ic', name: 'Insurance Claim Support', description: 'Paperwork & estimate prep', price: 1000, type: 'scheduled', vehicleType: 'Car', category: 'Administrative' },
  { id: 'c-cw', name: 'Car Washing / Detailing', description: 'Deep clean wash', price: 450, type: 'scheduled', vehicleType: 'Car', category: 'Wash' },
  { id: 'c-ab', name: 'Alignment & Balancing', description: 'Laser guided alignment', price: 800, type: 'scheduled', vehicleType: 'Car', category: 'Maintenance' },
  { id: 'c-chw', name: 'Chemical Wash', description: 'Premium chemical engine/body wash', price: 1200, type: 'scheduled', vehicleType: 'Car', category: 'Wash' },
  { id: 'c-hmv', name: 'Commercial / HMV Service', description: 'Heavy vehicle maintenance', price: 5000, type: 'scheduled', vehicleType: 'Both', category: 'Maintenance' },

  // --- BIKE: Scheduled Maintenance ---
  { id: 'b-gs', name: 'General Service', description: 'Comprehensive bike check-up', price: 800, type: 'scheduled', vehicleType: 'Bike', category: 'Maintenance' },
  { id: 'b-oc', name: 'Engine Oil Change', description: 'Synthetic oil for bikes', price: 400, type: 'scheduled', vehicleType: 'Bike', category: 'Maintenance' },
  { id: 'b-af', name: 'Air Filter Cleaning/Replacement', description: 'Performance cleaning', price: 150, type: 'scheduled', vehicleType: 'Bike', category: 'Maintenance' },
  { id: 'b-bc', name: 'Brake Check', description: 'Cables & lever adjustment', price: 100, type: 'scheduled', vehicleType: 'Bike', category: 'Maintenance' },
  { id: 'b-cl', name: 'Chain Cleaning / Lubrication', description: 'Drivetrain maintenance', price: 200, type: 'scheduled', vehicleType: 'Bike', category: 'Maintenance' },
  { id: 'b-bt', name: 'Battery Check', description: 'Charging system test', price: 50, type: 'scheduled', vehicleType: 'Bike', category: 'Maintenance' },
  { id: 'b-tc', name: 'Tyre Check', description: 'Thread & pressure check', price: 50, type: 'scheduled', vehicleType: 'Bike', category: 'Maintenance' },
  { id: 'b-bi', name: 'Basic Inspection', description: 'Lights, nuts, bolts', price: 150, type: 'scheduled', vehicleType: 'Bike', category: 'Maintenance' },

  // --- RSA: Emergency Roadside Assistance ---
  { id: 'rsa-tp', name: 'Tyre Puncture Repair / Support', description: 'Quick on-site fix', price: 200, type: 'rsa', category: 'Emergency' },
  { id: 'rsa-bt', name: 'Blown Tyre / Flat Tyre Assistance', description: 'Spare change support', price: 300, type: 'rsa', category: 'Emergency' },
  { id: 'rsa-js', name: 'Jump Start', description: 'Emergency battery restart', price: 250, type: 'rsa', category: 'Emergency' },
  { id: 'rsa-td', name: 'Towing Dispatch', description: 'Flatbed or tow-truck setup', price: 1500, type: 'rsa', category: 'Emergency' },
  { id: 'rsa-cl', name: 'Coolant Tank Leak emergency support', description: 'Leak plugging & top-up', price: 500, type: 'rsa', category: 'Emergency' },
  { id: 'rsa-ob', name: 'Minor On-spot Breakdown Assistance', description: 'Quick diagnostics & fix', price: 400, type: 'rsa', category: 'Emergency' },
];

export const INITIAL_JOBS: Job[] = [
  {
    id: 'jc-1',
    customerName: 'Tariq Mir',
    serviceName: 'Tyre Puncture',
    location: 'Sonwar',
    vehicle: 'Maruti Swift',
    eta: '8 min',
    status: 'live',
    type: 'rsa',
    partner: "Car Choice",
    customerUid: 'anonymous',
    fee: 150,
    urgent: true
  },
  {
    id: 'jc-2',
    customerName: 'Bashir Ahmed',
    serviceName: 'Periodic Service',
    location: 'Lal Chowk',
    vehicle: 'Toyota Innova',
    eta: 'Tomorrow 10 AM',
    status: 'pending',
    type: 'scheduled',
    partner: "Maheen Motors",
    customerUid: 'anonymous',
    fee: 1200
  },
  {
    id: 'jc-3',
    customerName: 'Zubair Shah',
    serviceName: 'Wheel Alignment',
    location: 'Batamaloo',
    vehicle: 'Hyundai Creta',
    eta: '14 min',
    status: 'en-route',
    type: 'scheduled',
    partner: "Sky Tyre Emporium",
    customerUid: 'anonymous',
    fee: 800
  }
];

export const PARTNERS: Partner[] = [
  { id: 'P1', name: "Ahmad's Garage", types: ['Car', 'RSA'], location: 'Lal Chowk', status: 'online', initials: 'AG', owner: 'Ahmad Wani', phone: '94190XXXXX', timing: '9 AM - 7 PM' },
  { 
    id: 'P01', 
    name: "Car Choice", 
    owner: "Noor Mohd.",
    location: "Sanatnagar, near 7 Eleven",
    phone: "7006427220",
    email: "owaisnoor45@gmail.com",
    timing: "9 AM – 6 PM",
    types: ["Insurance claim", "General services", "Washing", "Alignment & balancing"],
    typeDesc: "Multi-service garage",
    status: "online", 
    initials: "CC" 
  },
  { 
    id: 'P02', 
    name: "Elite Car Care", 
    owner: "Murawat Hussain Khan",
    location: "Mirabad, opposite Al-Barq Hospital, Bypass Road, Batamaloo",
    phone: "9186028969",
    email: "elitecarecaresgr@gmail.com",
    timing: "9 AM – 7 PM",
    types: ["Car washing", "All LMV mechanic"],
    typeDesc: "LMV mechanic + wash",
    status: "online", 
    initials: "EC" 
  },
  { 
    id: 'P03', 
    name: "Habib Automobile", 
    owner: "Mohd. Shahid Bhat",
    location: "Nowgam Bypass",
    phone: "6005822389",
    email: "habibautomobiles18@gmail.com",
    timing: "9 AM – 6 PM",
    types: ["Mechanic service", "Ford", "Hyundai", "Toyota"],
    typeDesc: "Brand-focused mechanic garage",
    status: "online", 
    initials: "HA" 
  },
  { 
    id: 'P04', 
    name: "Maheen Motors", 
    owner: "Ayaz Ahmad Dar",
    location: "Nowgam Bypass, near flyover",
    phone: "7006961065",
    email: "maheenmotors4@gmail.com",
    timing: "9 AM – 6 PM",
    types: ["All car brands", "All services", "Chemical wash"],
    typeDesc: "Full-service multi-brand mechanic garage",
    status: "pending_verification", 
    initials: "MM" 
  },
  { 
    id: 'P05', 
    name: "Aaqib Motors", 
    owner: "Aaqib Naseer",
    location: "Old Barzulla, Rambagh Road",
    phone: "7051893387",
    email: "umerhaniya987@gmail.com",
    timing: "9:30 AM – 8 PM",
    types: ["Mechanic"],
    typeDesc: "General mechanic garage",
    status: "online", 
    initials: "AM" 
  },
  { 
    id: 'P06', 
    name: "Sultan’s Garage", 
    owner: "Mehraj Ud Din",
    location: "Barzulla Bund, Tengpora Bridge, Hyderpora",
    phone: "7006247138",
    email: "mehrajrenzoo6719@gmail.com",
    timing: "9 AM – 6 PM",
    types: ["General Service"],
    typeDesc: "Garage/Mechanic",
    status: "online", 
    initials: "SG" 
  },
  { 
    id: 'P07', 
    name: "Fayaz Automobiles", 
    owner: "Fayaz Ahmad Nath",
    location: "Marshal Ward, Shop No. 51, Batamaloo",
    phone: "6005715795",
    email: "fayazahn@gmail.com",
    timing: "9 AM – 6 PM",
    types: ["LMV", "Commercial", "HMV"],
    typeDesc: "LMV + commercial vehicle mechanic",
    status: "online", 
    initials: "FA" 
  },
  { 
    id: 'P08', 
    name: "Imtiyaz Automobiles", 
    owner: "Imtiyaz Ahmad",
    location: "Kral Khod",
    phone: "9858703050",
    email: "imtiyazautomobile@gmail.com",
    timing: "9 AM – 8 PM",
    types: ["2-wheeler services"],
    typeDesc: "Bike mechanic / 2-wheeler service partner",
    status: "online", 
    initials: "IA" 
  },
  { 
    id: 'P09', 
    name: "Titan Motors", 
    owner: "Shoaib Khan",
    location: "Old Barzulla",
    phone: "8825036678",
    email: "titanmotors96@gmail.com",
    timing: "9 AM – 7 PM",
    types: ["General Mechanic"],
    typeDesc: "Mechanic garage",
    status: "pending_verification", 
    initials: "TM" 
  },
  { 
    id: 'P10', 
    name: "Sky Tyre Emporium", 
    owner: "Abdul Rashid Kambay",
    location: "Batamaloo",
    phone: "9419018860",
    email: "rashidkambay@gmail.com",
    timing: "10 AM – 6 PM",
    types: ["Alignment", "Tyre changing", "Fitting", "Balancing"],
    typeDesc: "Tyre / alignment specialist",
    status: "online", 
    initials: "ST" 
  },
];

export const PRODUCTS: MarketplaceProduct[] = [
  { id: 'prd-1', name: 'Synthetic Oil 5W-40', brand: 'Castrol', price: 2400, image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=200&auto=format&fit=crop', category: 'Lube' },
  { id: 'prd-2', name: 'Performance Brake Pads', brand: 'Brembo', price: 1850, image: 'https://images.unsplash.com/photo-1486006396123-c775656a8a94?q=80&w=200&auto=format&fit=crop', category: 'Brakes' },
  { id: 'prd-3', name: 'High-Beam LED set', brand: 'Philips', price: 3200, image: 'https://images.unsplash.com/photo-1635770335015-846c26887570?q=80&w=200&auto=format&fit=crop', category: 'Lights' },
];
