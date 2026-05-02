const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const blogs = [
    {
      title: "Ultimate Guide to Cab Booking in Lucknow: Tips & Tricks",
      slug: "ultimate-guide-cab-booking-lucknow",
      content: `
        <h2>Why Choose Professional Cab Services in Lucknow?</h2>
        <p>Lucknow, the city of Nawabs, is known for its culture, heritage, and unfortunately, its growing traffic. Navigating through the busy streets of Hazratganj or reaching Chaudhary Charan Singh International Airport on time can be a challenge. That's where professional cab services like <strong>CabX</strong> come in.</p>
        
        <h3>1. Reliability and Punctuality</h3>
        <p>When you book with a reputable service, you don't have to worry about last-minute cancellations. Our drivers are trained to prioritize your schedule.</p>
        
        <h3>2. Transparent Pricing</h3>
        <p>Forget the hassle of bargaining with local auto-rickshaws. With CabX, you get upfront pricing with no hidden costs.</p>
        
        <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=1000" alt="Bus and Cab" style="width:100%; border-radius:20px; margin: 20px 0;" />
        
        <h3>3. Safety First</h3>
        <p>All our vehicles are GPS-tracked, and our drivers undergo rigorous background checks to ensure your safety throughout the journey.</p>
        
        <h2>How to Book Your First Ride?</h2>
        <p>Booking a ride with CabX is as simple as 1-2-3. Just visit our website, enter your pickup and drop locations, select your preferred car type, and you're good to go!</p>
      `,
      excerpt: "Master the art of navigating Lucknow with our comprehensive guide to cab booking. Learn about pricing, safety, and why CabX is the preferred choice.",
      author: "CabX Travel Team",
      category: "Guides",
      featuredImage: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=1200",
      imageAltText: "Driver holding steering wheel in Lucknow",
      metaTitle: "Cab Booking Lucknow - The Ultimate Guide | CabX",
      metaDescription: "Looking for reliable cab services in Lucknow? Read our ultimate guide to learn about pricing, safety tips, and how to book the best rides in the city.",
      focusKeyword: "cab booking lucknow",
      isActive: true,
      publishDate: new Date(),
      readTime: 6,
      faqSchema: [
        { question: "How much does a cab cost in Lucknow?", answer: "Prices start from as low as ₹10 per km, depending on the car type and distance." },
        { question: "Is it safe to book a cab at night?", answer: "Yes, CabX provides 24/7 monitored rides with emergency support for night travelers." }
      ]
    },
    {
      title: "Airport Transfers Made Easy: Why CabX is Your Best Choice",
      slug: "airport-transfers-lucknow-made-easy",
      content: `
        <h2>Never Miss a Flight Again</h2>
        <p>Catching a flight at Chaudhary Charan Singh International Airport (LKO) requires precise timing. Traffic in Lucknow can be unpredictable, making the journey stressful if not planned correctly.</p>
        
        <h3>Dedicated Airport Fleet</h3>
        <p>At CabX, we maintain a dedicated fleet for airport transfers. Our drivers are well-versed with the fastest routes and current traffic patterns to ensure you reach the terminal at least 2 hours before your flight.</p>
        
        <img src="https://images.unsplash.com/photo-1436491865332-7a61a109c05a?auto=format&fit=crop&q=80&w=1000" alt="Airplane at Airport" style="width:100%; border-radius:20px; margin: 20px 0;" />
        
        <h3>Meet and Greet Service</h3>
        <p>Arriving in Lucknow? Our drivers will be waiting for you at the arrival gate with a placard, ready to assist with your luggage and take you to your destination in comfort.</p>
        
        <h2>Fixed Pricing for Peace of Mind</h2>
        <p>We offer flat rates for airport pickups and drops from most parts of the city. No surge pricing, no surprises.</p>
      `,
      excerpt: "Simplify your airport travel in Lucknow. Discover why CabX offers the most reliable and affordable airport transfer services in the city.",
      author: "Rahul Sharma",
      category: "Travel",
      featuredImage: "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?auto=format&fit=crop&q=80&w=1200",
      imageAltText: "Person at airport with luggage",
      metaTitle: "Reliable Airport Transfers in Lucknow | CabX Services",
      metaDescription: "Book your Lucknow airport taxi with CabX. Fixed prices, professional drivers, and 100% on-time guarantee. Travel to LKO airport stress-free.",
      focusKeyword: "airport transfers lucknow",
      isActive: true,
      publishDate: new Date(),
      readTime: 4,
      faqSchema: [
        { question: "Can I book an airport cab in advance?", answer: "Yes, you can book up to 30 days in advance on our website." },
        { question: "Are there any extra charges for luggage?", answer: "No, standard luggage is included in your fixed fare." }
      ]
    },
    {
      title: "5 Must-Visit Hidden Gems Near Lucknow – Plan Your Weekend Trip",
      slug: "5-hidden-gems-near-lucknow-weekend-trip",
      content: `
        <h2>Escape the City Hustle</h2>
        <p>Lucknow is beautiful, but sometimes you just need a break. Luckily, there are several stunning destinations just a few hours away that are perfect for a weekend getaway.</p>
        
        <h3>1. Dewa Sharif</h3>
        <p>Located just 25km away, this shrine is a symbol of communal harmony and features stunning architecture.</p>
        
        <h3>2. Naimisharanya</h3>
        <p>A significant spiritual hub, this ancient site is said to be the forest where sacred scriptures were written.</p>
        
        <img src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=1000" alt="Indian Heritage Site" style="width:100%; border-radius:20px; margin: 20px 0;" />
        
        <h3>3. Nawabganj Bird Sanctuary</h3>
        <p>Perfect for nature lovers and bird watchers, especially during the winter months when migratory birds arrive.</p>
        
        <h2>Travel in Comfort with CabX Outstation</h2>
        <p>Planning a round trip? Our outstation cab services offer comfortable sedans and SUVs at competitive daily rates. Enjoy the scenery while we handle the road.</p>
      `,
      excerpt: "Looking for a weekend escape? Discover 5 hidden gems near Lucknow that are perfect for a quick road trip with CabX outstation services.",
      author: "Aditi Gupta",
      category: "Guides",
      featuredImage: "https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=1200",
      imageAltText: "Ancient temple architecture",
      metaTitle: "5 Weekend Getaways Near Lucknow | CabX Outstation",
      metaDescription: "Discover the best places to visit near Lucknow for a weekend trip. From spiritual hubs to bird sanctuaries, plan your road trip with CabX.",
      focusKeyword: "places to visit near lucknow",
      isActive: true,
      publishDate: new Date(),
      readTime: 7,
      faqSchema: [
        { question: "Does CabX provide outstation services?", answer: "Yes, we provide one-way and round-trip outstation services to over 50 cities near Lucknow." },
        { question: "What car options are available for long trips?", answer: "We offer Sedans for small families and SUVs (Innova, Ertiga) for larger groups." }
      ]
    }
  ];

  for (const blog of blogs) {
    await prisma.blog.create({ data: blog });
    console.log(`Inserted: ${blog.title}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
