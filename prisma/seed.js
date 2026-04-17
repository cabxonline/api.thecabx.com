require("dotenv").config()
const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcrypt")

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash("admin123", 10)

  console.log("Seeding core roles...")
  const roles = ["SUPERADMIN", "ADMIN", "MANAGER", "USER", "DRIVER"]
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName }
    })
  }

  const superAdminRole = await prisma.role.findUnique({ where: { name: "SUPERADMIN" } })

  console.log("Seeding default SuperAdmin...")
  await prisma.user.upsert({
    where: { email: "admin@thecabx.com" },
    update: {},
    create: {
      name: "CabX Admin",
      email: "admin@thecabx.com",
      password,
      roleId: superAdminRole.id
    }
  })

  console.log("Seeding permissions...")
  const permissions = [
    { key: "booking.read", name: "View Bookings" },
    { key: "booking.create", name: "Create Bookings" },
    { key: "booking.update", name: "Update Bookings" },
    { key: "booking.delete", name: "Delete Bookings" },
    { key: "driver.read", name: "View Drivers" },
    { key: "driver.create", name: "Create Drivers" },
    { key: "driver.update", name: "Update Drivers" },
    { key: "driver.delete", name: "Delete Drivers" },
    { key: "car.read", name: "View Cars" },
    { key: "car.create", name: "Create Cars" },
    { key: "car.update", name: "Update Cars" },
    { key: "car.delete", name: "Delete Cars" },
    { key: "role.read", name: "View Roles" },
    { key: "role.create", name: "Create Roles" },
    { key: "role.update", name: "Update Roles" },
    { key: "role.delete", name: "Delete Roles" }
  ]

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { name: p.name },
      create: p
    })
  }

  const allPerms = await prisma.permission.findMany()
  console.log("Assigning all permissions to SUPERADMIN...")
  
  // Clean up old assignments if any (for idempotency)
  await prisma.rolePermission.deleteMany({ where: { roleId: superAdminRole.id } })
  
  await prisma.rolePermission.createMany({
    data: allPerms.map(p => ({
      roleId: superAdminRole.id,
      permissionId: p.id
    })),
    skipDuplicates: true
  })

  console.log("\x1b[32m%s\x1b[0m", "✅ Seeding successful!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })