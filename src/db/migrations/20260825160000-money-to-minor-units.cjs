"use strict";

/**
 * Converts Account.balance and Transaction.amount from DECIMAL major units
 * to BIGINT minor units (cents). Safe to re-run only on fresh DECIMAL data.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'Accounts'
            AND column_name = 'balance'
            AND data_type = 'numeric'
        ) THEN
          UPDATE "Accounts"
          SET balance = ROUND(balance::numeric * 100);
          ALTER TABLE "Accounts"
            ALTER COLUMN balance TYPE BIGINT
            USING ROUND(balance::numeric)::bigint;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'Transactions'
            AND column_name = 'amount'
            AND data_type = 'numeric'
        ) THEN
          UPDATE "Transactions"
          SET amount = ROUND(amount::numeric * 100);
          ALTER TABLE "Transactions"
            ALTER COLUMN amount TYPE BIGINT
            USING ROUND(amount::numeric)::bigint;
        END IF;
      END $$;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'Accounts'
            AND column_name = 'balance'
            AND data_type = 'bigint'
        ) THEN
          ALTER TABLE "Accounts"
            ALTER COLUMN balance TYPE NUMERIC(14,2)
            USING (balance::numeric / 100);
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'Transactions'
            AND column_name = 'amount'
            AND data_type = 'bigint'
        ) THEN
          ALTER TABLE "Transactions"
            ALTER COLUMN amount TYPE NUMERIC(14,2)
            USING (amount::numeric / 100);
        END IF;
      END $$;
    `);
  },
};
