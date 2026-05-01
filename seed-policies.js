const prisma = require("./utils/prisma")

async function seedPolicies() {
  const policies = [
    {
      key: "terms-and-condition",
      title: "Terms and Conditions",
      content: "<h1>Terms and Conditions</h1><p>Welcome to CabX. By using our services, you agree to these terms...</p>"
    },
    {
      key: "privacy-policy",
      title: "Privacy Policy",
      content: "<h1>Privacy Policy</h1><p>Your privacy is important to us. This policy explains how we collect and use your data...</p>"
    },
    {
      key: "refund-policy",
      title: "Refund Policy",
      content: "<h1>Refund Policy</h1><p>Our refund policy: 6 hours before: 25% refund, 24 hours before: 50% refund...</p>"
    }
  ]

  for (const p of policies) {
    await prisma.policy.upsert({
      where: { key: p.key },
      update: {},
      create: p
    })
  }
  console.log("✅ Policies seeded")
}

seedPolicies()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
