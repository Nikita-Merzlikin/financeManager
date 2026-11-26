"use strict";

/**
 * Creates UserSettings (1:1 with Users) for privacy + preferences.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("UserSettings", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      profileVisibility: {
        type: Sequelize.ENUM("public", "private"),
        allowNull: false,
        defaultValue: "private",
      },
      showEmail: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      showDateOfBirth: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      showAvatar: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      allowAnalytics: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      language: {
        type: Sequelize.ENUM("en", "ru", "uk"),
        allowNull: false,
        defaultValue: "uk",
      },
      currency: {
        type: Sequelize.ENUM("UAH", "USD", "EUR"),
        allowNull: false,
        defaultValue: "UAH",
      },
      unitSystem: {
        type: Sequelize.ENUM("metric", "imperial"),
        allowNull: false,
        defaultValue: "metric",
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable("UserSettings");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_UserSettings_profileVisibility";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_UserSettings_language";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_UserSettings_currency";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_UserSettings_unitSystem";',
    );
  },
};
