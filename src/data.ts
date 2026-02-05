import { AgroEcologyProject } from './types';

export const projects: AgroEcologyProject[] = [
  {
    id: 1,
    name: "Philippi Horticultural Area Urban Farming Initiative",
    location: {
      lat: -33.9897,
      lng: 18.5635,
      place: "Philippi",
      region: "Western Cape",
      country: "South Africa"
    },
    description: "Community-led urban agriculture project promoting food sovereignty and sustainable farming practices in Cape Town's agricultural corridor.",
    type: "Urban Agriculture",
    practices: ["Organic farming", "Permaculture", "Water conservation", "Composting"],
    established: 2018,
    size_hectares: 12,
    beneficiaries: 85,
    crops: ["Vegetables", "Leafy greens", "Herbs"],
    organization: "Philippi Farming Collective",
    status: "active"
  },
  {
    id: 2,
    name: "Eastern Cape Smallholder Agroforestry Network",
    location: {
      lat: -32.2968,
      lng: 26.4194,
      place: "Keiskammahoek",
      region: "Eastern Cape",
      country: "South Africa"
    },
    description: "Integrated agroforestry system combining indigenous trees with traditional crops, focusing on soil restoration and climate resilience.",
    type: "Agroforestry",
    practices: ["Agroforestry", "Indigenous seed preservation", "Soil conservation", "Rainwater harvesting"],
    established: 2015,
    size_hectares: 45,
    beneficiaries: 230,
    crops: ["Maize", "Beans", "Sorghum", "Fruit trees"],
    organization: "Eastern Cape Farmers Cooperative",
    contact: "info@ecfarmerscoop.org.za",
    status: "active"
  },
  {
    id: 3,
    name: "Limpopo Regenerative Agriculture Hub",
    location: {
      lat: -23.4013,
      lng: 29.4179,
      place: "Giyani",
      region: "Limpopo",
      country: "South Africa"
    },
    description: "Training and demonstration center for regenerative agriculture practices, focusing on drought-resistant farming and traditional knowledge integration.",
    type: "Training & Demonstration",
    practices: ["Regenerative agriculture", "No-till farming", "Crop rotation", "Indigenous knowledge"],
    established: 2020,
    size_hectares: 28,
    beneficiaries: 450,
    crops: ["Millet", "Cowpeas", "Indigenous vegetables"],
    organization: "Limpopo Regenerative Farmers Alliance",
    website: "https://example.org/limpopo-regen",
    status: "active"
  },
  {
    id: 4,
    name: "KwaZulu-Natal Community Seed Bank",
    location: {
      lat: -29.6144,
      lng: 30.3794,
      place: "Pietermaritzburg",
      region: "KwaZulu-Natal",
      country: "South Africa"
    },
    description: "Community seed preservation and exchange network maintaining biodiversity and food security through traditional seed varieties.",
    type: "Seed Sovereignty",
    practices: ["Seed saving", "Participatory plant breeding", "Organic farming"],
    established: 2017,
    size_hectares: 8,
    beneficiaries: 320,
    crops: ["Indigenous grains", "Traditional vegetables", "Legumes"],
    organization: "KZN Seed Keepers Network",
    status: "active"
  },
  {
    id: 5,
    name: "Zambezi Valley Organic Cotton Project",
    location: {
      lat: -15.6257,
      lng: 28.2833,
      place: "Siavonga",
      region: "Southern Province",
      country: "Zambia"
    },
    description: "Organic cotton production using ecological pest management and fair trade principles, supporting smallholder farmers.",
    type: "Cash Crop - Organic",
    practices: ["Organic pest management", "Crop rotation", "Fair trade"],
    established: 2019,
    size_hectares: 120,
    beneficiaries: 180,
    crops: ["Organic cotton", "Sunflower", "Maize"],
    organization: "Zambezi Organic Farmers Cooperative",
    status: "active"
  },
  {
    id: 6,
    name: "Maputo Green Belt Initiative",
    location: {
      lat: -25.9655,
      lng: 32.5832,
      place: "Matola",
      region: "Maputo Province",
      country: "Mozambique"
    },
    description: "Peri-urban agriculture project providing fresh vegetables to Maputo using sustainable irrigation and integrated pest management.",
    type: "Peri-urban Agriculture",
    practices: ["Drip irrigation", "IPM", "Market gardening", "Composting"],
    established: 2016,
    size_hectares: 35,
    beneficiaries: 145,
    crops: ["Tomatoes", "Onions", "Cabbage", "Peppers"],
    organization: "Maputo Sustainable Agriculture Association",
    status: "active"
  },
  {
    id: 7,
    name: "Mashonaland Permaculture Training Center",
    location: {
      lat: -17.8252,
      lng: 31.0335,
      place: "Harare",
      region: "Harare Province",
      country: "Zimbabwe"
    },
    description: "Educational facility demonstrating permaculture design principles adapted to semi-arid conditions.",
    type: "Training & Demonstration",
    practices: ["Permaculture design", "Keyline water management", "Food forests"],
    established: 2014,
    size_hectares: 15,
    beneficiaries: 680,
    crops: ["Mixed vegetables", "Fruit trees", "Indigenous fruits"],
    organization: "Zimbabwe Permaculture Institute",
    website: "https://example.org/zim-permaculture",
    status: "active"
  },
  {
    id: 8,
    name: "Free State Climate-Smart Agriculture Pilot",
    location: {
      lat: -28.4541,
      lng: 26.8668,
      place: "Thaba Nchu",
      region: "Free State",
      country: "South Africa"
    },
    description: "Pilot project testing climate-adaptive farming techniques including conservation agriculture and livestock integration.",
    type: "Climate Adaptation",
    practices: ["Conservation agriculture", "Livestock integration", "Cover cropping"],
    established: 2021,
    size_hectares: 65,
    beneficiaries: 95,
    crops: ["Wheat", "Sunflower", "Lucerne"],
    organization: "Free State Agricultural Development Agency",
    status: "pilot"
  }
];
