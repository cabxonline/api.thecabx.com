require("dotenv").config()

const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcrypt")

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function main() {

  const password = await bcrypt.hash("123456", 10)

  /* -----------------------
     PERMISSIONS
  ----------------------- */

  const permissions = [
    { key: "dashboard.view", name: "View Dashboard" },
    { key: "users.view", name: "View Users" },
    { key: "users.create", name: "Create Users" },
    { key: "users.update", name: "Update Users" },
    { key: "users.delete", name: "Delete Users" },

    { key: "roles.view", name: "View Roles" },
    { key: "roles.create", name: "Create Roles" },

    { key: "bookings.view", name: "View Bookings" },
    { key: "bookings.create", name: "Create Bookings" }
  ]

  await prisma.permission.createMany({
    data: permissions,
    skipDuplicates: true
  })

  /* -----------------------
     ROLES
  ----------------------- */

  const superAdmin = await prisma.role.upsert({
    where: { name: "Super Admin" },
    update: {},
    create: { name: "Super Admin" }
  })

  const admin = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: { name: "Admin" }
  })

  const manager = await prisma.role.upsert({
    where: { name: "Manager" },
    update: {},
    create: { name: "Manager" }
  })

  const userRole = await prisma.role.upsert({
    where: { name: "User" },
    update: {},
    create: { name: "User" }
  })

  /* -----------------------
     FETCH PERMISSIONS
  ----------------------- */

  const allPermissions = await prisma.permission.findMany()

  /* -----------------------
     SUPER ADMIN → ALL
  ----------------------- */

  await prisma.rolePermission.createMany({
    data: allPermissions.map(p => ({
      role_id: superAdmin.id,
      permission_id: p.id
    })),
    skipDuplicates: true
  })

  /* -----------------------
     ADMIN PERMISSIONS
  ----------------------- */

  const adminPermissions = allPermissions.filter(
    p => p.key !== "roles.create"
  )

  await prisma.rolePermission.createMany({
    data: adminPermissions.map(p => ({
      role_id: admin.id,
      permission_id: p.id
    })),
    skipDuplicates: true
  })

  /* -----------------------
     MANAGER PERMISSIONS
  ----------------------- */

  const managerPermissions = allPermissions.filter(p =>
    ["dashboard.view", "bookings.view", "bookings.create"].includes(p.key)
  )

  await prisma.rolePermission.createMany({
    data: managerPermissions.map(p => ({
      role_id: manager.id,
      permission_id: p.id
    })),
    skipDuplicates: true
  })

  /* -----------------------
     TEAM
  ----------------------- */

  const team = await prisma.team.upsert({
    where: { name: "Cruise Saga HQ" },
    update: {},
    create: { name: "Cruise Saga HQ" }
  })

  /* -----------------------
     USER
  ----------------------- */

  const user = await prisma.user.upsert({
    where: { email: "admin@cruisesaga.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@cruisesaga.com",
      password
    }
  })

  /* -----------------------
     TEAM USER ROLE
  ----------------------- */

  await prisma.teamUser.upsert({
    where: {
      user_id_team_id: {
        user_id: user.id,
        team_id: team.id
      }
    },
    update: {},
    create: {
      user_id: user.id,
      team_id: team.id,
      role_id: superAdmin.id
    }
  })

  console.log("RBAC seed completed")
}

main()
  .catch(e => {
    console.error(e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })