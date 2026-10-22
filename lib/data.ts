export type Template = {
  id: string;
  name: string;
  category: string;
  brand: string;
  title: string;
  subtitle: string;
  cta: string;
  color: string;
  theme: string;
  image?: string;
};
export const templates: Template[] = [
  {
    id: "welcome",
    name: "A warm welcome",
    category: "Welcome",
    brand: "wildwonder",
    title: "A little closer\nto the outdoors.",
    subtitle:
      "Fresh air. New perspectives. Your next adventure starts here. Welcome to a world of everyday wonders.",
    cta: "Find your adventure",
    color: "#3d5748",
    theme: "nature",
    image: "photo-1472396961693-142e6e269027",
  },
  {
    id: "launch",
    name: "Something worth sharing",
    category: "Product updates",
    brand: "Layers",
    title: "Good things.\nNow in your hands.",
    subtitle:
      "Meet your new everyday essentials. Thoughtfully designed. Made to make a difference.",
    cta: "Meet the collection",
    color: "#6e56ae",
    theme: "product",
  },
  {
    id: "newsletter",
    name: "The Sunday edit",
    category: "Newsletters",
    brand: "the slow journal",
    title: "A slower kind\nof Sunday.",
    subtitle:
      "A few good reads, a fresh perspective, and a little inspiration for the week ahead.",
    cta: "Take a moment",
    color: "#8d6048",
    theme: "editorial",
    image: "photo-1445116572660-236099ec97a0",
  },
  {
    id: "sale",
    name: "A little something for you",
    category: "Promotions",
    brand: "form & field",
    title: "Your favorites.\nA little less.",
    subtitle:
      "Consider this your invitation to make room for something lovely. Explore our seasonal collection.",
    cta: "Explore the edit",
    color: "#cb653b",
    theme: "sale",
  },
  {
    id: "order",
    name: "Good things are on the way",
    category: "Transactional",
    brand: "STUDIO GOODS",
    title: "Made your day.\nOn its way.",
    subtitle:
      "Thank you for your order. We’re getting your new favorites ready for their next chapter.",
    cta: "View your order",
    color: "#375f7a",
    theme: "order",
  },
  {
    id: "event",
    name: "You’re on the guest list",
    category: "Events",
    brand: "COMMON GROUND",
    title: "Good people.\nGreat ideas.",
    subtitle:
      "An evening of conversation, creativity, and connections. Save a spot at our next community gathering.",
    cta: "Save your seat",
    color: "#545641",
    theme: "event",
  },
  {
    id: "cart",
    name: "Worth another look",
    category: "Promotions",
    brand: "form & field",
    title: "Still thinking\nabout it?",
    subtitle:
      "Your next favorite is waiting for you. Take another look at the pieces you saved.",
    cta: "Back to your favorites",
    color: "#976553",
    theme: "product",
  },
  {
    id: "update",
    name: "A fresh perspective",
    category: "Product updates",
    brand: "Layers",
    title: "Less busywork.\nMore possibility.",
    subtitle:
      "Discover the latest improvements, crafted to make your everyday workflow feel a little lighter.",
    cta: "See what’s new",
    color: "#6550a1",
    theme: "event",
  },
];
export const plans = [
  {
    name: "Free",
    price: 0,
    templates: 3,
    features: [
      "3 saved templates",
      "Visual email editor",
      "Responsive previews",
      "HTML export",
    ],
  },
  {
    name: "Starter",
    price: 299,
    templates: 25,
    features: [
      "25 saved templates",
      "Everything in Free",
      "Reusable content blocks",
      "Custom brand styles",
    ],
  },
  {
    name: "Pro",
    price: 799,
    templates: 100,
    features: [
      "100 saved templates",
      "Everything in Starter",
      "5 brand workspaces",
      "Priority support",
    ],
  },
  {
    name: "Business",
    price: 1999,
    templates: 500,
    features: [
      "500 saved templates",
      "Everything in Pro",
      "10 team members",
      "Dedicated onboarding",
    ],
  },
];
export const annualDiscount = 0.2;
