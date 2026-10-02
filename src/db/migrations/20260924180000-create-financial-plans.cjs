"use strict";

/**
 * Creates FinancialPlans, FinancialPlanCategories, FinancialPlanDays
 * with one-active-plan-per-user partial unique index.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("FinancialPlans", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.ENUM("active", "archived"),
        allowNull: false,
        defaultValue: "active",
      },
      income: { type: Sequelize.BIGINT, allowNull: false },
      averageExpenses: { type: Sequelize.BIGINT, allowNull: false },
      mandatoryExpenses: { type: Sequelize.BIGINT, allowNull: false },
      desiredSavings: { type: Sequelize.BIGINT, allowNull: false },
      goal: { type: Sequelize.STRING(200), allowNull: false },
      targetAmount: { type: Sequelize.BIGINT, allowNull: false },
      targetDate: { type: Sequelize.DATEONLY, allowNull: false },
      frequency: {
        type: Sequelize.ENUM(
          "daily",
          "twice_a_week",
          "weekly",
          "twice_a_month",
          "monthly",
        ),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: "UAH",
      },
      startDate: { type: Sequelize.DATEONLY, allowNull: false },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX financial_plans_one_active_per_user
      ON "FinancialPlans" ("userId")
      WHERE status = 'active';
    `);

    await queryInterface.createTable("FinancialPlanCategories", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
      },
      financialPlanId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "FinancialPlans", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      categoryId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "Categories", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      limitAmount: { type: Sequelize.BIGINT, allowNull: false },
      isMandatory: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("FinancialPlanCategories", {
      unique: true,
      fields: ["financialPlanId", "categoryId"],
      name: "financial_plan_categories_plan_category_unique",
    });

    await queryInterface.createTable("FinancialPlanDays", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
      },
      financialPlanId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "FinancialPlans", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      plannedAmount: { type: Sequelize.BIGINT, allowNull: false },
      locked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("FinancialPlanDays", {
      unique: true,
      fields: ["financialPlanId", "date"],
      name: "financial_plan_days_plan_date_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("FinancialPlanDays");
    await queryInterface.dropTable("FinancialPlanCategories");
    await queryInterface.dropTable("FinancialPlans");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_FinancialPlans_status";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_FinancialPlans_frequency";',
    );
  },
};
