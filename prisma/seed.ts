import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

// Free photos from Unsplash (Unsplash License). Replace from the admin panel via Uploadthing.
const img = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

const categories = [
  { name: "T-Shirts", slug: "t-shirts" },
  { name: "Shirts", slug: "shirts" },
  { name: "Dresses", slug: "dresses" },
  { name: "Knitwear", slug: "knitwear" },
  { name: "Denim", slug: "denim" },
  { name: "Outerwear", slug: "outerwear" },
  { name: "Accessories", slug: "accessories" },
];

type Colour = { name: string; hex: string };
const C = {
  black: { name: "Black", hex: "#111111" },
  white: { name: "White", hex: "#F5F3EF" },
  beige: { name: "Beige", hex: "#D8C6A8" },
  sand: { name: "Sand", hex: "#C9B28F" },
  grey: { name: "Grey", hex: "#9A9792" },
  navy: { name: "Navy", hex: "#1F2A44" },
  lightBlue: { name: "Light Blue", hex: "#A9BFD8" },
  midBlue: { name: "Mid Blue", hex: "#5B7BA3" },
  brown: { name: "Brown", hex: "#6B4A33" },
} satisfies Record<string, Colour>;

const CORE_SIZES = ["XS", "S", "M", "L", "XL"];

type SeedProduct = {
  name: string;
  slug: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  description: string;
  images: string[];
  colours: Colour[];
  sizes: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  skuPrefix: string;
};

const products: SeedProduct[] = [
  {
    name: "Oversized T-Shirt",
    slug: "oversized-t-shirt",
    category: "t-shirts",
    price: 3490,
    description:
      "Heavyweight 240 GSM cotton tee with a dropped shoulder and boxy fit. Pre-shrunk, so it keeps its shape wash after wash. Our best-seller for bulk and team orders.",
    images: [img("1622445270936-5dcb604970e7"), img("1599255068390-206e0d068539"), img("1581655353564-df123a1eb820")],
    colours: [C.black, C.white, C.beige],
    sizes: ["S", "M", "L", "XL", "XXL"],
    isNew: true,
    isFeatured: true,
    skuPrefix: "OVT",
  },
  {
    name: "Essential Crew Tee",
    slug: "essential-crew-tee",
    category: "t-shirts",
    price: 2490,
    description: "A slim, everyday crew-neck in soft combed cotton. Light enough for Colombo heat, made to layer under shirts and blazers.",
    images: [img("1583743814966-8936f5b7be1a"), img("1618677603286-0ec56cb6e1b5")],
    colours: [C.black, C.white, C.grey],
    sizes: CORE_SIZES,
    skuPrefix: "ECT",
  },
  {
    name: "Oversized Poplin Shirt",
    slug: "oversized-poplin-shirt",
    category: "shirts",
    price: 6990,
    description: "Crisp cotton poplin cut long and relaxed. Wear it buttoned, open over a tee, or tucked into denim.",
    images: [img("1600219823854-f3bfee26ea9c"), img("1582822785550-d465062c62e9")],
    colours: [C.white, C.lightBlue],
    sizes: CORE_SIZES,
    isNew: true,
    skuPrefix: "OPS",
  },
  {
    name: "Linen Resort Shirt",
    slug: "linen-resort-shirt",
    category: "shirts",
    price: 7490,
    compareAtPrice: 8990,
    description: "Breathable 100% linen with a soft camp collar. Naturally cool for tropical weather and gets softer with every wash.",
    images: [img("1783113298894-eeb3b71315d9")],
    colours: [C.white, C.sand],
    sizes: CORE_SIZES,
    skuPrefix: "LRS",
  },
  {
    name: "Slit Midi Dress",
    slug: "slit-midi-dress",
    category: "dresses",
    price: 10990,
    description: "A sleeveless midi with a clean neckline and side slit. Fluid crepe fabric that moves with you, from office to evening.",
    images: [img("1586024795129-38d4e68bdd0c"), img("1606049925382-6badf6de768e")],
    colours: [C.black],
    sizes: CORE_SIZES,
    isNew: true,
    isFeatured: true,
    skuPrefix: "SMD",
  },
  {
    name: "Little Black Dress",
    slug: "little-black-dress",
    category: "dresses",
    price: 8990,
    compareAtPrice: 12490,
    description: "A timeless fitted mini dress with a square neckline. Fully lined, with a concealed back zip.",
    images: [img("1522218296581-1244648997fb"), img("1533659828870-95ee305cee3e")],
    colours: [C.black],
    sizes: CORE_SIZES,
    skuPrefix: "LBD",
  },
  {
    name: "Soft Wool Sweater",
    slug: "soft-wool-sweater",
    category: "knitwear",
    price: 9990,
    description: "A relaxed crew-neck sweater in a soft wool blend. Ribbed cuffs and hem, slightly dropped shoulder.",
    images: [img("1626854586365-94312f94c8e5"), img("1610460894518-5067fcb96aab")],
    colours: [C.beige, C.brown],
    sizes: ["S", "M", "L", "XL"],
    isNew: true,
    isFeatured: true,
    skuPrefix: "SWS",
  },
  {
    name: "Knit Lounge Set Top",
    slug: "knit-lounge-top",
    category: "knitwear",
    price: 7990,
    compareAtPrice: 10990,
    description: "A fine-gauge knit top with a relaxed fit, designed to pair with our wide-leg trousers or your favourite denim.",
    images: [img("1697425603592-23863028592b")],
    colours: [C.sand, C.white],
    sizes: ["S", "M", "L"],
    skuPrefix: "KLT",
  },
  {
    name: "Straight Leg Jeans",
    slug: "straight-leg-jeans",
    category: "denim",
    price: 9990,
    description: "High-rise, straight-leg jeans in rigid cotton denim. A classic five-pocket cut that softens and shapes to you over time.",
    images: [img("1584370848010-d7fe6bc767ec"), img("1541099649105-f69ad21f3246")],
    colours: [C.midBlue, C.lightBlue],
    sizes: ["XS", "S", "M", "L", "XL"],
    isNew: true,
    skuPrefix: "SLJ",
  },
  {
    name: "Wide Leg Jeans",
    slug: "wide-leg-jeans",
    category: "denim",
    price: 10490,
    description: "Full-length wide-leg jeans with a high waist. Mid-blue wash with a clean finish.",
    images: [img("1578693082747-50c396cacd81")],
    colours: [C.midBlue],
    sizes: CORE_SIZES,
    skuPrefix: "WLJ",
  },
  {
    name: "Classic Denim Jacket",
    slug: "classic-denim-jacket",
    category: "denim",
    price: 12990,
    compareAtPrice: 15990,
    description: "The jacket that goes with everything. Mid-weight denim, button front, chest pockets and a slightly cropped body.",
    images: [img("1577660002965-04865592fc60"), img("1485811661309-ab85183a729c")],
    colours: [C.midBlue],
    sizes: CORE_SIZES,
    skuPrefix: "CDJ",
  },
  {
    name: "Belted Trench Coat",
    slug: "belted-trench-coat",
    category: "outerwear",
    price: 18990,
    description: "A double-breasted trench in water-resistant cotton twill, with a removable belt and storm flap. Built for monsoon season.",
    images: [img("1788120680424-60c0069f9e61")],
    colours: [C.beige],
    sizes: ["S", "M", "L"],
    isFeatured: true,
    skuPrefix: "BTC",
  },
  {
    name: "Tailored Blazer",
    slug: "tailored-blazer",
    category: "outerwear",
    price: 15990,
    description: "A single-breasted blazer with a softly structured shoulder. Half-lined for comfort in warm weather.",
    images: [img("1697663426683-530277eb4fbd")],
    colours: [C.beige, C.black],
    sizes: CORE_SIZES,
    isNew: true,
    skuPrefix: "TBZ",
  },
  {
    name: "Leather Tote Bag",
    slug: "leather-tote-bag",
    category: "accessories",
    price: 14990,
    description: "A roomy tote in smooth genuine leather that fits a 14-inch laptop. Inner zip pocket and magnetic closure.",
    images: [img("1760624294582-5341f33f9fa4"), img("1760624294504-211e763ee0fb")],
    colours: [C.black, C.brown],
    sizes: ["Free Size"],
    isFeatured: true,
    skuPrefix: "LTB",
  },
  {
    name: "Mini Crossbody Bag",
    slug: "mini-crossbody-bag",
    category: "accessories",
    price: 7990,
    compareAtPrice: 9990,
    description: "A compact crossbody with an adjustable strap. Just enough room for your phone, cards and keys.",
    images: [img("1624687943971-e86af76d57de")],
    colours: [C.brown],
    sizes: ["Free Size"],
    skuPrefix: "MCB",
  },
];

// Deterministic "random" stock so the seed always gives the same result.
// One variant per product is left low (≤3) and a few are sold out, to show stock handling.
function stockFor(i: number) {
  const pattern = [24, 40, 18, 3, 32, 0, 15, 50, 12, 28];
  return pattern[i % pattern.length];
}

async function main() {
  console.log("Seeding…");

  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.productVariant.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();

  // Order numbers start at TL-1001 so they look like a real store's.
  await db.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Order"', 'number'), 1000, true)`);

  const categoryIds = new Map<string, string>();
  for (const [i, c] of categories.entries()) {
    const created = await db.category.create({ data: { ...c, sortOrder: i } });
    categoryIds.set(c.slug, created.id);
  }

  let n = 0;
  for (const p of products) {
    await db.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        images: p.images,
        isNew: p.isNew ?? false,
        isFeatured: p.isFeatured ?? false,
        categoryId: categoryIds.get(p.category)!,
        variants: {
          create: p.colours.flatMap((colour) =>
            p.sizes.map((size) => ({
              size,
              colour: colour.name,
              colourHex: colour.hex,
              sku: `${p.skuPrefix}-${colour.name.replace(/\s+/g, "").slice(0, 3).toUpperCase()}-${size === "Free Size" ? "OS" : size}`,
              stock: stockFor(n++),
            })),
          ),
        },
      },
    });
  }

  const email = (process.env.ADMIN_EMAIL ?? "admin@threadline.lk").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 10) {
    throw new Error("Set ADMIN_PASSWORD (10+ characters) in .env before seeding");
  }
  await db.adminUser.upsert({
    where: { email },
    update: { passwordHash: await bcrypt.hash(password, 12) },
    create: { email, name: "Store Admin", passwordHash: await bcrypt.hash(password, 12) },
  });

  console.log(`Seeded ${categories.length} categories, ${products.length} products and admin ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
