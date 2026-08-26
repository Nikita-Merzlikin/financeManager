"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rows = [
      { name: "Salary", type: "income", icon: "salary" },
      { name: "Freelance", type: "income", icon: "work" },
      { name: "Other income", type: "income", icon: "plus" },
      { name: "Food", type: "expense", icon: "food" },
      { name: "Transport", type: "expense", icon: "transport" },
      { name: "Home", type: "expense", icon: "home" },
      { name: "Health", type: "expense", icon: "health" },
      { name: "Entertainment", type: "expense", icon: "fun" },
      { name: "Savings transfer", type: "expense", icon: "piggy" },
      { name: "Other expense", type: "expense", icon: "minus" },
    ].map((item) => ({
      id: queryInterface.sequelize.literal("gen_random_uuid()"),
      userId: null,
      name: item.name,
      type: item.type,
      icon: item.icon,
      createdAt: now,
      updatedAt: now,
    }));

    const existing = await queryInterface.sequelize.query(
      `SELECT COUNT(*)::int AS count FROM "Categories" WHERE "userId" IS NULL`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );
    if (existing[0]?.count > 0) return;

    await queryInterface.bulkInsert("Categories", rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Categories", { userId: null });
  },
};
