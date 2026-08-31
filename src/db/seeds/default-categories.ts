import { TransactionType } from "src/core/enums/finance.enums";

/** System-wide default categories (userId = null). Used by seeder + fallback. */
export const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: TransactionType;
  icon: string;
}> = [
  { name: "Salary", type: TransactionType.INCOME, icon: "salary" },
  { name: "Freelance", type: TransactionType.INCOME, icon: "work" },
  { name: "Other income", type: TransactionType.INCOME, icon: "plus" },
  { name: "Food", type: TransactionType.EXPENSE, icon: "food" },
  { name: "Transport", type: TransactionType.EXPENSE, icon: "transport" },
  { name: "Home", type: TransactionType.EXPENSE, icon: "home" },
  { name: "Health", type: TransactionType.EXPENSE, icon: "health" },
  { name: "Entertainment", type: TransactionType.EXPENSE, icon: "fun" },
  { name: "Savings transfer", type: TransactionType.EXPENSE, icon: "piggy" },
  { name: "Other expense", type: TransactionType.EXPENSE, icon: "minus" },
];
