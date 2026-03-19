export interface ListingItem {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  sellerName: string;
  sellerAvatar: string;
  sellerRating: number;
  description: string;
  condition: string;
  postedAt: string;
  pickupLocation: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    isOnCampus: boolean;
  };
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  contactName: string;
  contactAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  itemTitle: string;
  itemImage: string;
  messages: Message[];
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  followers: number;
  following: number;
  bio: string;
  major: string;
  year: string;
  listings: ListingItem[];
  isFollowing?: boolean;
}

export interface Notification {
  id: string;
  type: "follower" | "review" | "item_alert" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
  itemImage?: string;
}

export const categories = [
  "All",
  "Textbooks",
  "Electronics",
  "Furniture",
  "Clothing",
  "Sports",
  "Music",
  "Dorm",
  "Other",
];

export const listings: ListingItem[] = [
  {
    id: "1",
    title: "Calculus Textbook (8th Ed.)",
    price: 45,
    image: "https://images.unsplash.com/photo-1705636070427-8234f647b5bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2VkJTIwdGV4dGJvb2slMjBjb2xsZWdlfGVufDF8fHx8MTc3MTk5NjQyMnww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Textbooks",
    sellerName: "Marcus J.",
    sellerAvatar: "https://images.unsplash.com/photo-1729697967428-5b98d11486a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0JTIwbWFsZXxlbnwxfHx8fDE3NzE5OTY0MjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    sellerRating: 4.8,
    description: "Barely used calculus textbook, perfect condition. Some highlighting in chapter 3.",
    condition: "Like New",
    postedAt: "2 hours ago",
    pickupLocation: {
      name: "University of Texas at Arlington",
      address: "701 S Nedderman Dr, Arlington, TX 76019",
      lat: 32.735687,
      lng: -97.108065,
      isOnCampus: true,
    },
  },
  {
    id: "2",
    title: "MacBook Pro 2023",
    price: 899,
    image: "https://images.unsplash.com/flagged/photo-1576697010739-6373b63f3204?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjBjb21wdXRlciUyMGRlc2t8ZW58MXx8fHwxNzcxODg1Mjk1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Electronics",
    sellerName: "Sarah K.",
    sellerAvatar: "https://images.unsplash.com/photo-1709811240710-cff5f04deb44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0JTIwZmVtYWxlfGVufDF8fHx8MTc3MTk5NjQyNXww&ixlib=rb-4.1.0&q=80&w=1080",
    sellerRating: 4.9,
    description: "Selling my MacBook Pro, upgraded to desktop. Comes with charger and case.",
    condition: "Good",
    postedAt: "5 hours ago",
    pickupLocation: {
      name: "The Lofts at West Campus",
      address: "1000 W Mitchell St, Arlington, TX 76013",
      lat: 32.732145,
      lng: -97.115234,
      isOnCampus: false,
    },
  },
  {
    id: "3",
    title: "Mountain Bike - Trek",
    price: 275,
    image: "https://images.unsplash.com/photo-1741676516502-69250deb38ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaWN5Y2xlJTIwY2FtcHVzJTIwb3V0ZG9vcnxlbnwxfHx8fDE3NzE5OTY0MjN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Sports",
    sellerName: "Jake T.",
    sellerAvatar: "https://images.unsplash.com/photo-1729697967428-5b98d11486a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0JTIwbWFsZXxlbnwxfHx8fDE3NzE5OTY0MjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    sellerRating: 4.5,
    description: "Great campus bike, recently tuned up. Perfect for getting around UTA.",
    condition: "Good",
    postedAt: "1 day ago",
    pickupLocation: {
      name: "University of Texas at Arlington",
      address: "701 S Nedderman Dr, Arlington, TX 76019",
      lat: 32.735687,
      lng: -97.108065,
      isOnCampus: true,
    },
  },
  {
    id: "4",
    title: "Sony WH-1000XM5 Headphones",
    price: 180,
    image: "https://images.unsplash.com/photo-1715356434396-4a09652383b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBoZWFkcGhvbmVzJTIwZWxlY3Ryb25pY3N8ZW58MXx8fHwxNzcxOTczNTg3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Electronics",
    sellerName: "Priya M.",
    sellerAvatar: "https://images.unsplash.com/photo-1709811240710-cff5f04deb44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0JTIwZmVtYWxlfGVufDF8fHx8MTc3MTk5NjQyNXww&ixlib=rb-4.1.0&q=80&w=1080",
    sellerRating: 5.0,
    description: "Noise-cancelling headphones, amazing for studying in the library.",
    condition: "Like New",
    postedAt: "3 hours ago",
    pickupLocation: {
      name: "University of Texas at Arlington",
      address: "701 S Nedderman Dr, Arlington, TX 76019",
      lat: 32.735687,
      lng: -97.108065,
      isOnCampus: true,
    },
  },
  {
    id: "5",
    title: "LED Desk Lamp",
    price: 25,
    image: "https://images.unsplash.com/photo-1621447980929-6638614633c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNrJTIwbGFtcCUyMHN0dWR5fGVufDF8fHx8MTc3MTkzNjQ5M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Dorm",
    sellerName: "Alex R.",
    sellerAvatar: "https://images.unsplash.com/photo-1729697967428-5b98d11486a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0JTIwbWFsZXxlbnwxfHx8fDE3NzE5OTY0MjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    sellerRating: 4.2,
    description: "Adjustable LED desk lamp with USB charging port. Multiple brightness settings.",
    condition: "Good",
    postedAt: "6 hours ago",
    pickupLocation: {
      name: "University of Texas at Arlington",
      address: "701 S Nedderman Dr, Arlington, TX 76019",
      lat: 32.735687,
      lng: -97.108065,
      isOnCampus: true,
    },
  },
  {
    id: "6",
    title: "North Face Backpack",
    price: 55,
    image: "https://images.unsplash.com/photo-1535982330050-f1c2fb79ff78?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWNrcGFjayUyMHNjaG9vbHxlbnwxfHx8fDE3NzE5OTY0MjN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Clothing",
    sellerName: "Maria L.",
    sellerAvatar: "https://images.unsplash.com/photo-1709811240710-cff5f04deb44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0JTIwZmVtYWxlfGVufDF8fHx8MTc3MTk5NjQyNXww&ixlib=rb-4.1.0&q=80&w=1080",
    sellerRating: 4.7,
    description: "Barely used backpack, tons of compartments. Great for heavy textbook days.",
    condition: "Like New",
    postedAt: "1 day ago",
    pickupLocation: {
      name: "University of Texas at Arlington",
      address: "701 S Nedderman Dr, Arlington, TX 76019",
      lat: 32.735687,
      lng: -97.108065,
      isOnCampus: true,
    },
  },
  {
    id: "7",
    title: "Nike Air Force 1 (Size 10)",
    price: 65,
    image: "https://images.unsplash.com/photo-1759542890353-35f5568c1c90?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbmVha2VycyUyMHNob2VzJTIwY2FzdWFsfGVufDF8fHx8MTc3MTk5NjQyM3ww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Clothing",
    sellerName: "Devon W.",
    sellerAvatar: "https://images.unsplash.com/photo-1729697967428-5b98d11486a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0JTIwbWFsZXxlbnwxfHx8fDE3NzE5OTY0MjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    sellerRating: 4.3,
    description: "Worn a handful of times. Clean and in great shape.",
    condition: "Good",
    postedAt: "4 hours ago",
    pickupLocation: {
      name: "University of Texas at Arlington",
      address: "701 S Nedderman Dr, Arlington, TX 76019",
      lat: 32.735687,
      lng: -97.108065,
      isOnCampus: true,
    },
  },
  {
    id: "8",
    title: "Acoustic Guitar - Yamaha",
    price: 120,
    image: "https://images.unsplash.com/photo-1628887067605-5171efd812e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxndWl0YXIlMjBhY291c3RpYyUyMGluc3RydW1lbnR8ZW58MXx8fHwxNzcxOTMxNTU1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Music",
    sellerName: "Chris B.",
    sellerAvatar: "https://images.unsplash.com/photo-1729697967428-5b98d11486a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0JTIwbWFsZXxlbnwxfHx8fDE3NzE5OTY0MjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    sellerRating: 4.6,
    description: "Great beginner guitar. Comes with a soft case and extra strings.",
    condition: "Good",
    postedAt: "2 days ago",
    pickupLocation: {
      name: "University of Texas at Arlington",
      address: "701 S Nedderman Dr, Arlington, TX 76019",
      lat: 32.735687,
      lng: -97.108065,
      isOnCampus: true,
    },
  },
  {
    id: "9",
    title: "Mini Fridge - Insignia",
    price: 80,
    image: "https://images.unsplash.com/photo-1677296860174-5369253e7896?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pJTIwZnJpZGdlJTIwZG9ybXxlbnwxfHx8fDE3NzE5OTY0MjR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Dorm",
    sellerName: "Tina N.",
    sellerAvatar: "https://images.unsplash.com/photo-1709811240710-cff5f04deb44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0JTIwZmVtYWxlfGVufDF8fHx8MTc3MTk5NjQyNXww&ixlib=rb-4.1.0&q=80&w=1080",
    sellerRating: 4.4,
    description: "Perfect dorm fridge, works great. Moving off-campus so no longer needed.",
    condition: "Good",
    postedAt: "12 hours ago",
    pickupLocation: {
      name: "Arbor Apartments",
      address: "2200 W Park Row Dr, Arlington, TX 76013",
      lat: 32.729856,
      lng: -97.118923,
      isOnCampus: false,
    },
  },
  {
    id: "10",
    title: "TI-84 Plus Calculator",
    price: 60,
    image: "https://images.unsplash.com/photo-1675242314995-034d11bac319?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWxjdWxhdG9yJTIwc2NpZW50aWZpY3xlbnwxfHx8fDE3NzE5OTA3NDV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Electronics",
    sellerName: "Marcus J.",
    sellerAvatar: "https://images.unsplash.com/photo-1729697967428-5b98d11486a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0JTIwbWFsZXxlbnwxfHx8fDE3NzE5OTY0MjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    sellerRating: 4.8,
    description: "Used for one semester of statistics. Works perfectly, includes cover.",
    condition: "Like New",
    postedAt: "8 hours ago",
    pickupLocation: {
      name: "University of Texas at Arlington",
      address: "701 S Nedderman Dr, Arlington, TX 76019",
      lat: 32.735687,
      lng: -97.108065,
      isOnCampus: true,
    },
  },
];

export const conversations: Conversation[] = [
  {
    id: "c1",
    contactName: "Sarah K.",
    contactAvatar: "https://images.unsplash.com/photo-1709811240710-cff5f04deb44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0JTIwZmVtYWxlfGVufDF8fHx8MTc3MTk5NjQyNXww&ixlib=rb-4.1.0&q=80&w=1080",
    lastMessage: "Can you do $800?",
    lastMessageTime: "2m ago",
    unread: 2,
    itemTitle: "MacBook Pro 2023",
    itemImage: "https://images.unsplash.com/flagged/photo-1576697010739-6373b63f3204?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjBjb21wdXRlciUyMGRlc2t8ZW58MXx8fHwxNzcxODg1Mjk1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    messages: [
      { id: "m1", senderId: "me", text: "Hey! Is the MacBook still available?", timestamp: "10:30 AM" },
      { id: "m2", senderId: "other", text: "Yes it is! Are you interested?", timestamp: "10:32 AM" },
      { id: "m3", senderId: "me", text: "Definitely. Would you take $800 for it?", timestamp: "10:35 AM" },
      { id: "m4", senderId: "other", text: "I could do $850. It's basically brand new.", timestamp: "10:36 AM" },
      { id: "m5", senderId: "me", text: "Can you do $800?", timestamp: "10:38 AM" },
    ],
  },
  {
    id: "c2",
    contactName: "Jake T.",
    contactAvatar: "https://images.unsplash.com/photo-1729697967428-5b98d11486a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0JTIwbWFsZXxlbnwxfHx8fDE3NzE5OTY0MjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    lastMessage: "Meet at the UC at 3?",
    lastMessageTime: "1h ago",
    unread: 0,
    itemTitle: "Mountain Bike - Trek",
    itemImage: "https://images.unsplash.com/photo-1741676516502-69250deb38ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaWN5Y2xlJTIwY2FtcHVzJTIwb3V0ZG9vcnxlbnwxfHx8fDE3NzE5OTY0MjN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    messages: [
      { id: "m1", senderId: "other", text: "Hey, interested in the bike?", timestamp: "9:00 AM" },
      { id: "m2", senderId: "me", text: "Yeah! Can I see it today?", timestamp: "9:15 AM" },
      { id: "m3", senderId: "other", text: "Sure! Meet at the UC at 3?", timestamp: "9:20 AM" },
    ],
  },
  {
    id: "c3",
    contactName: "Priya M.",
    contactAvatar: "https://images.unsplash.com/photo-1709811240710-cff5f04deb44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0JTIwZmVtYWxlfGVufDF8fHx8MTc3MTk5NjQyNXww&ixlib=rb-4.1.0&q=80&w=1080",
    lastMessage: "Sounds good, deal!",
    lastMessageTime: "3h ago",
    unread: 1,
    itemTitle: "Sony WH-1000XM5",
    itemImage: "https://images.unsplash.com/photo-1715356434396-4a09652383b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBoZWFkcGhvbmVzJTIwZWxlY3Ryb25pY3N8ZW58MXx8fHwxNzcxOTczNTg3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    messages: [
      { id: "m1", senderId: "me", text: "Hi! Would you take $160 for the headphones?", timestamp: "1:00 PM" },
      { id: "m2", senderId: "other", text: "How about $170? They're basically new.", timestamp: "1:05 PM" },
      { id: "m3", senderId: "me", text: "Deal! Where should we meet?", timestamp: "1:10 PM" },
      { id: "m4", senderId: "other", text: "Sounds good, deal!", timestamp: "1:12 PM" },
    ],
  },
];

export const currentUser: UserProfile = {
  id: "me",
  name: "Jordan Rivera",
  avatar: "https://images.unsplash.com/photo-1729697967428-5b98d11486a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0JTIwbWFsZXxlbnwxfHx8fDE3NzE5OTY0MjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
  rating: 4.7,
  reviewCount: 23,
  followers: 156,
  following: 89,
  bio: "CS Major @ UTA | Class of 2027 | Always buying & selling!",
  major: "Computer Science",
  year: "Junior",
  listings: [listings[0], listings[4], listings[9]],
};

export const friends: UserProfile[] = [
  {
    id: "f1",
    name: "Sarah Kim",
    avatar: "https://images.unsplash.com/photo-1709811240710-cff5f04deb44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0JTIwZmVtYWxlfGVufDF8fHx8MTc3MTk5NjQyNXww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.9,
    reviewCount: 45,
    followers: 234,
    following: 112,
    bio: "Business Major | Love thrifting!",
    major: "Business",
    year: "Senior",
    listings: [listings[1], listings[3]],
    isFollowing: true,
  },
  {
    id: "f2",
    name: "Jake Torres",
    avatar: "https://images.unsplash.com/photo-1729697967428-5b98d11486a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0JTIwbWFsZXxlbnwxfHx8fDE3NzE5OTY0MjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: 4.5,
    reviewCount: 18,
    followers: 98,
    following: 67,
    bio: "Kinesiology | Outdoors enthusiast",
    major: "Kinesiology",
    year: "Sophomore",
    listings: [listings[2], listings[6]],
    isFollowing: true,
  },
];

export const notifications: Notification[] = [
  {
    id: "n1",
    type: "follower",
    title: "New Follower",
    message: "Sarah Kim started following you",
    timestamp: "2 hours ago",
    read: false,
    avatar: "https://images.unsplash.com/photo-1709811240710-cff5f04deb44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0JTIwZmVtYWxlfGVufDF8fHx8MTc3MTk5NjQyNXww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "n2",
    type: "review",
    title: "New Review",
    message: "Marcus J. left you a 5-star review: \"Great buyer, smooth transaction!\"",
    timestamp: "5 hours ago",
    read: false,
    avatar: "https://images.unsplash.com/photo-1729697967428-5b98d11486a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0JTIwbWFsZXxlbnwxfHx8fDE3NzE5OTY0MjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "n3",
    type: "item_alert",
    title: "New Item Match",
    message: "New MacBook Pro listing matches your interests - $899",
    timestamp: "1 day ago",
    read: true,
    itemImage: "https://images.unsplash.com/flagged/photo-1576697010739-6373b63f3204?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjBjb21wdXRlciUyMGRlc2t8ZW58MXx8fHwxNzcxODg1Mjk1fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "n4",
    type: "system",
    title: "Price Drop Alert",
    message: "An item you saved dropped to $45!",
    timestamp: "1 day ago",
    read: true,
  },
  {
    id: "n5",
    type: "follower",
    title: "New Follower",
    message: "Jake Torres started following you",
    timestamp: "2 days ago",
    read: true,
    avatar: "https://images.unsplash.com/photo-1729697967428-5b98d11486a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudCUyMHBvcnRyYWl0JTIwbWFsZXxlbnwxfHx8fDE3NzE5OTY0MjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "n6",
    type: "item_alert",
    title: "New Item Match",
    message: "Sony WH-1000XM5 Headphones listed in Electronics - $180",
    timestamp: "3 days ago",
    read: true,
    itemImage: "https://images.unsplash.com/photo-1715356434396-4a09652383b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBoZWFkcGhvbmVzJTIwZWxlY3Ryb25pY3N8ZW58MXx8fHwxNzcxOTczNTg3fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
];